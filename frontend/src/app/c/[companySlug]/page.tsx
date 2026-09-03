"use client";

import { use, useEffect, useState, useCallback } from "react";
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
import { Radio, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";

type Filter = "ALL" | PostType;

export default function FeedPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = use(params);

  const [company, setCompany] = useState<Company | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
        communityApi.feed(companySlug, filter),
      ]);
      setCompany(c);
      setPosts(f);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  }, [companySlug, filter]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

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
            <Link
              href={`/c/${companySlug}/pulse`}
              className="btn text-xs flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-dim" />
              Pulse Monitor
            </Link>
            <button
              onClick={() => void load()}
              title="Refresh feed"
              className="btn p-2"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Composer */}
        <PostCreator companySlug={companySlug} onCreated={handleCreated} />

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-line">
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
                No entries found under this filter. Break the silence with an
                anonymous note above.
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
        </div>
      </main>

      <Footer />
    </div>
  );
}