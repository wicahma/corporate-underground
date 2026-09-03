"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  companiesApi,
  communityApi,
  type Company,
  type Post,
  type PostType,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeedCard } from "@/components/FeedCard";
import { PostCreator } from "@/components/PostCreator";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { Radio, RefreshCw, AlertCircle, ShieldAlert, UserPlus, Loader2 } from "lucide-react";

type Filter = "ALL" | PostType;
type Sort = "latest" | "hottest" | "popular";

function FeedInner({ companySlug }: { companySlug: string }) {
  const { user, refresh } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("latest");
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notMember, setNotMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Membership check
  const membership = user?.memberships.find(
    (m) => m.company.slug === companySlug,
  );
  const isMember = Boolean(membership);
  const isVerified = membership?.status === "VERIFIED";

  const load = useCallback(
    async (append = false) => {
      if (!isMember) return;
      if (append && !hasMore) return;
      (append ? setLoadMore : setLoading)(true);
      setError(null);
      try {
        const [c, f] = await Promise.all([
          companiesApi.bySlug(companySlug).catch(() => ({
            id: "",
            name: companySlug.toUpperCase(),
            slug: companySlug,
            allowedDomains: [],
            logoUrl: null,
            members: 0,
          })),
          communityApi.feed(
            companySlug,
            filter,
            sort,
            append ? (cursorRef.current ?? undefined) : undefined,
          ),
        ]);
        setCompany(c);
        if (append) {
          setPosts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...f.filter((p) => !seen.has(p.id))];
          });
        } else {
          setPosts(f);
        }
        cursorRef.current = f.length ? (f[f.length - 1].id ?? null) : null;
        setHasMore(f.length > 0);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load feed.");
        setHasMore(false);
      } finally {
        (append ? setLoadMore : setLoading)(false);
      }
    },
    [companySlug, filter, sort, hasMore, isMember],
  );

  // Reset pagination when filter/sort changes
  useEffect(() => {
    if (!isMember) return;
    cursorRef.current = null;
    setHasMore(true);
    const t = window.setTimeout(() => void load(false), 0);
    return () => window.clearTimeout(t);
  }, [filter, sort, isMember, load]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!isMember || observerRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadMore) {
          void load(true);
        }
      },
      { rootMargin: "300px" },
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [isMember, hasMore, loading, loadMore, load]);

  // Company fetch for non-members (still show join UI + info)
  useEffect(() => {
    if (isMember) return;
    companiesApi
      .bySlug(companySlug)
      .then(setCompany)
      .catch(() => {});
  }, [companySlug, isMember]);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    setJoinNotice(null);
    try {
      await companiesApi.join(companySlug);
      await refresh();
      setJoinNotice(
        "Membership granted. You can now read the stream. Verify with your corporate email for full posting access.",
      );
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to join company.");
    } finally {
      setJoining(false);
    }
  };

  const handleCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header companySlug={companySlug} companyName={company?.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Company Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-line">
          <div>
            <div className="label mb-1">// SECURE COMPOUND</div>
            <h1 className="text-xl font-bold tracking-tight text-fg uppercase">
              {company?.name ?? companySlug}
            </h1>
            <p className="text-[11px] text-dim font-mono mt-1">
              {company?.members ?? 0} VERIFIED WORKERS · STRICT PSEUDONYMITY
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <>
                <Link
                  href={`/c/${companySlug}/pulse`}
                  className="btn text-xs flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-dim" />
                  Pulse Monitor
                </Link>
                <button
                  onClick={() => void load(false)}
                  title="Refresh feed"
                  className="btn p-2"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </>
            ) : (
              <button
                onClick={() => void handleJoin()}
                disabled={joining}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                {joining ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {joining ? "JOINING..." : "JOIN COMPANY"}
              </button>
            )}
          </div>
        </div>

        {joinNotice && (
          <div className="mb-5 p-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[11px] font-mono">
            {joinNotice}
          </div>
        )}

        {!isMember && !joinNotice && (
          <div className="card p-6 border-line bg-panel mb-6">
            <div className="flex items-center gap-3 text-fg text-xs mb-2">
              <ShieldAlert className="w-4 h-4 text-dim shrink-0" />
              <span className="font-semibold">You don&apos;t have access</span>
            </div>
            <p className="text-[11px] text-dim font-mono">
              {company?.name ?? companySlug} is a private company compound.
              Join to read the anonymous stream. Verified employees get full
              posting rights and a sealed pseudonym.
            </p>
          </div>
        )}

        {isMember && (
          <>
            {/* Composer */}
            <PostCreator companySlug={companySlug} onCreated={handleCreated} />

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-line">
              <div className="label">FILTER STREAM</div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["ALL", "All"],
                    ["NORMAL", "Notes"],
                    ["HOT_TAKE", "Hot Takes"],
                    ["CONFESSION", "Confessions"],
                    ["POLL", "Polls"],
                  ] as [Filter, string][]
                ).map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`tab ${filter === f ? "tab-active" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {(
                  [
                    ["latest", "Latest"],
                    ["hottest", "Hottest"],
                    ["popular", "Popular"],
                  ] as [Sort, string][]
                ).map(([s, label]) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`tab ${sort === s ? "tab-active" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed List */}
            {error && (
              <div className="card p-6 border-danger/40 bg-danger/5 mb-6">
                <div className="flex items-center gap-3 text-danger text-xs mb-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Unable to fetch stream</span>
                </div>
                <p className="text-[11px] text-dim font-mono mb-4">{error}</p>
                <p className="text-[10px] text-dim font-mono">
                  Tip: Verify your corporate email for /{companySlug} under the
                  Verify tab.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {posts.map((p) => (
                <FeedCard key={p.id} post={p} companySlug={companySlug} />
              ))}

              {!loading && posts.length === 0 && !error && (
                <div className="card p-12 text-center border-line">
                  <div className="label mb-2">// SILENCE IN THE TUNNEL</div>
                  <p className="text-xs text-dim font-mono max-w-sm mx-auto">
                    No entries found under this filter. Break the silence with
                    an anonymous note above.
                  </p>
                </div>
              )}

              {loading && posts.length === 0 && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="card p-6 border-line animate-pulse space-y-3"
                    >
                      <div className="h-4 bg-panel2 w-1/3" />
                      <div className="h-3 bg-panel2 w-3/4" />
                      <div className="h-3 bg-panel2 w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {loadMore && (
                <div className="py-4 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-dim" />
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-px" aria-hidden="true" />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function FeedPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = use(params);
  return (
    <RequireAuth>
      <FeedInner companySlug={companySlug} />
    </RequireAuth>
  );
}