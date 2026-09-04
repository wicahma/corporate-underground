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
import { CompanyVerificationCard } from "@/components/CompanyVerificationCard";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { Radio, RefreshCw, ShieldAlert, UserPlus, Loader2, Users } from "lucide-react";

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
  const [joining, setJoining] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Membership check
  const membership = user?.memberships.find(
    (m) => m.company.slug === companySlug,
  );
  const isMember = Boolean(membership);
  const isVerified = membership?.status === "VERIFIED";
  const needsVerification = isMember && !isVerified;

  const load = useCallback(
    async (append = false) => {
      if (!isMember) return;
      if (append && (!hasMoreRef.current || !cursorRef.current)) return;
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      (append ? setLoadMore : setLoading)(true);
      setError(null);
      try {
        const [c, feedData] = await Promise.all([
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
        const { posts: newPosts, nextCursor } = feedData;

        if (append) {
          setPosts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...newPosts.filter((p) => !seen.has(p.id))];
          });
        } else {
          setPosts(newPosts);
        }

        cursorRef.current = nextCursor;
        const more = Boolean(nextCursor);
        hasMoreRef.current = more;
        setHasMore(more);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load feed.");
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        fetchingRef.current = false;
        (append ? setLoadMore : setLoading)(false);
      }
    },
    [companySlug, filter, sort, isMember],
  );

  // Reset pagination when filter/sort changes
  useEffect(() => {
    if (!isMember) return;
    cursorRef.current = null;
    hasMoreRef.current = true;
    setHasMore(true);
    const t = window.setTimeout(() => void load(false), 0);
    return () => window.clearTimeout(t);
  }, [filter, sort, isMember, load]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!isMember) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreRef.current &&
          !fetchingRef.current &&
          cursorRef.current
        ) {
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
  }, [isMember, load]);

  // Company fetch for non-members
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
    <div className="flex min-h-screen flex-col bg-[#101010]">
      <Header companySlug={companySlug} companyName={company?.name} />

      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-6">
        {/* Company Header */}
        <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b border-[#262626]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#f3f5f7]">
              {company?.name ?? companySlug}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#777777]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {company?.members ?? 0} verified employees
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <>
                <Link
                  href={`/c/${companySlug}/pulse`}
                  className="rounded-full border border-[#262626] bg-[#181818] hover:bg-white/5 text-[#f3f5f7] text-xs font-semibold px-3.5 py-1.5 flex items-center gap-1.5 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-[#777777]" />
                  Pulse
                </Link>
                <button
                  onClick={() => void load(false)}
                  title="Refresh feed"
                  className="p-2 rounded-full border border-[#262626] bg-[#181818] hover:bg-white/5 text-[#777777] hover:text-[#f3f5f7] transition-colors"
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
                className="rounded-full bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 transition-colors flex items-center gap-1.5"
              >
                {joining ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {joining ? "Joining..." : "Join"}
              </button>
            )}
          </div>
        </div>

        {joinNotice && (
          <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs">
            {joinNotice}
          </div>
        )}

        {!isMember && !joinNotice && (
          <div className="card p-6 border-line bg-panel mb-6">
            <div className="flex items-center gap-3 text-fg text-sm mb-2">
              <ShieldAlert className="w-4 h-4 text-dim shrink-0" />
              <span className="font-semibold">Private Compound</span>
            </div>
            <p className="text-xs text-dim leading-relaxed">
              {company?.name ?? companySlug} is a private company network.
              Join to read the anonymous stream. Verified employees get full
              posting rights and sealed pseudonymity.
            </p>
          </div>
        )}

        {isMember && (
          <>
            {/* Unverified Member Warning & Quick Verification Card */}
            {needsVerification && (
              <CompanyVerificationCard
                companySlug={companySlug}
                companyName={company?.name}
                onVerified={() => {
                  void refresh();
                  void load(false);
                }}
              />
            )}

            {/* Composer */}
            <PostCreator companySlug={companySlug} onCreated={handleCreated} />

            {/* Pill filter tabs */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#262626] overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 shrink-0">
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
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      filter === f
                        ? "bg-white text-black"
                        : "text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(
                  [
                    ["latest", "Latest"],
                    ["hottest", "Hottest"],
                    ["popular", "Top"],
                  ] as [Sort, string][]
                ).map(([s, label]) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      sort === s
                        ? "bg-[#222222] text-[#f3f5f7]"
                        : "text-[#777777] hover:text-[#f3f5f7]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed List */}
            {error && (
              <div className="card p-5 border-danger/40 bg-danger/5 mb-6">
                <div className="flex items-center gap-2 text-danger text-xs mb-1 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Unable to fetch stream</span>
                </div>
                <p className="text-xs text-dim">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {posts.map((p) => (
                <FeedCard key={p.id} post={p} companySlug={companySlug} />
              ))}

              {!loading && posts.length === 0 && !error && (
                <div className="card p-12 text-center border-line">
                  <p className="text-sm font-semibold text-[#f3f5f7] mb-1">
                    No posts yet
                  </p>
                  <p className="text-xs text-[#777777] max-w-sm mx-auto">
                    Be the first to start a thread anonymously.
                  </p>
                </div>
              )}

              {loading && posts.length === 0 && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="card p-5 border-line animate-pulse space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-panel2" />
                        <div className="h-4 bg-panel2 w-1/3 rounded-full" />
                      </div>
                      <div className="h-3 bg-panel2 w-3/4 rounded-full" />
                      <div className="h-3 bg-panel2 w-1/2 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {loadMore && (
                <div className="py-4 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-dim" />
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