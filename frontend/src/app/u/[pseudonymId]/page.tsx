"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, fmtDate, type Post, normPost } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Identicon } from "@/components/Identicon";
import {
  AlertCircle,
  ShieldQuestion,
  Award,
  ThumbsUp,
  MessageSquare,
  Vote,
} from "lucide-react";

interface PublicProfile {
  pseudonym: string;
  avatarSeed: string;
  isMuted: boolean;
  company: { id: string; slug: string; name: string };
  createdAt: string;
  stats: {
    likes: number;
    comments: number;
    pollVotes: number;
    posts: number;
    score: number;
    tier: { name: string; min: number };
  };
  posts: {
    id: string;
    type: string;
    title: string | null;
    content: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    _count?: { comments: number; reactions: number };
  }[];
}

function tierIndex(min: number): number {
  const tiers = [0, 51, 201, 601, 1501];
  const idx = tiers.findIndex((t) => min === t);
  return idx === -1 ? 0 : idx;
}

function nextTier(tierMin: number): { name: string; min: number } | null {
  const all = [
    { name: "Novice Lurker", min: 0 },
    { name: "Underground Voice", min: 51 },
    { name: "Company Whisperer", min: 201 },
    { name: "Street Legend", min: 601 },
    { name: "The Shadow Syndicate", min: 1501 },
  ];
  const idx = all.findIndex((t) => t.min === tierMin);
  return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
}

function progressToNext(score: number, tierMin: number): number | null {
  const next = nextTier(tierMin);
  if (!next) return null;
  const span = next.min - tierMin;
  return Math.min(100, Math.round(((score - tierMin) / span) * 100));
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ pseudonymId: string }>;
}) {
  const { pseudonymId } = use(params);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<PublicProfile>(
          `/users/${pseudonymId}/profile`,
        );
        setProfile(data);
        // Show full history by default when posts exist
        setShowHistory((data.posts?.length ?? 0) > 1);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [pseudonymId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          <div className="card p-8 border-line animate-pulse space-y-4">
            <div className="h-5 bg-panel2 w-1/3" />
            <div className="h-3 bg-panel2 w-full" />
            <div className="h-3 bg-panel2 w-2/3" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          <div className="card p-8 border-danger/40 bg-danger/5">
            <div className="flex items-center gap-3 text-danger text-xs mb-2">
              <ShieldQuestion className="w-4 h-4" />
              <span className="font-semibold">Pseudonym not found</span>
            </div>
            <p className="text-[11px] text-dim font-mono">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tIdx = tierIndex(profile.stats.tier.min);
  const tierLabel = `TIER ${"I".repeat(tIdx + 1)}`;
  const progress = progressToNext(profile.stats.score, profile.stats.tier.min);
  const next = nextTier(profile.stats.tier.min);

  return (
    <div className="flex min-h-screen flex-col">
      <Header companySlug={profile.company.slug} companyName={profile.company.name} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Link
          href={`/c/${profile.company.slug}`}
          className="text-[10px] text-dim hover:text-fg uppercase tracking-widest flex items-center gap-1.5 mb-6"
        >
          ← Back to {profile.company.name}
        </Link>

        {/* Identity Header */}
        <div className="card p-6 border-line bg-panel mb-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-line">
            <Identicon
              seed={profile.avatarSeed || profile.pseudonym}
              size={48}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-fg uppercase">
                  {profile.pseudonym}
                </h1>
                {profile.isMuted && (
                  <span className="tag border-danger/40 text-danger text-[9px]">
                    Muted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-dim font-mono mt-0.5">
                ONE OF {profile.company.name.toUpperCase()}&apos;S ANONYMOUS
                VOICES · SINCE {fmtDate(profile.createdAt)}
              </p>
            </div>
          </div>

          {/* Reputation Tier */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-dim">
                <Award className="w-4 h-4" />
                <span className="label">
                  {profile.stats.tier.name} — {tierLabel}
                </span>
              </div>
              <span className="text-xs font-mono text-fg font-bold">
                {profile.stats.score} PTS
              </span>
            </div>

            <div className="h-2 bg-panel2 border border-line overflow-hidden mb-1.5">
              <div
                className="h-full bg-fg transition-all duration-500"
                style={{ width: `${progress ?? 100}%` }}
              />
            </div>
            <p className="text-[10px] text-dim font-mono">
              {next
                ? `${next.min - profile.stats.score} pts to ${next.name} (Tier ${"I".repeat(tierIndex(next.min) + 1)})`
                : "MAXIMUM TIER REACHED — THE SHADOW SYNDICATE"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                icon: ThumbsUp,
                label: "Likes Received",
                value: profile.stats.likes,
              },
              {
                icon: MessageSquare,
                label: "Comments",
                value: profile.stats.comments,
              },
              {
                icon: Vote,
                label: "Poll Votes",
                value: profile.stats.pollVotes,
              },
              {
                icon: ShieldQuestion,
                label: "Posts",
                value: profile.stats.posts,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-panel2 p-3 border border-line text-center"
              >
                <Icon className="w-3.5 h-3.5 text-dim mx-auto mb-1.5" />
                <div className="text-lg font-bold text-fg font-mono">
                  {value}
                </div>
                <div className="text-[9px] text-dim uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post History */}
        <div className="card p-6 border-line bg-panel">
          <div className="label mb-4">// POST HISTORY</div>

          {!profile.posts || profile.posts.length === 0 ? (
            <p className="text-[11px] text-dim font-mono text-center py-6">
              This pseudonym has not published anything yet.
            </p>
          ) : (
            <>
              {showHistory
                ? profile.posts.map(
                    (p): Post => ({
                      id: p.id,
                      type: (p.type as Post["type"]) ?? "NORMAL",
                      title: p.title ?? null,
                      content: p.content,
                      likeCount: p.likeCount ?? p._count?.reactions ?? 0,
                      commentCount:
                        p.commentCount ?? p._count?.comments ?? 0,
                      createdAt: p.createdAt,
                      author: {
                        pseudonym: profile.pseudonym,
                        avatarSeed: profile.avatarSeed,
                        reputation: profile.stats.score,
                      },
                      pollOptions: null,
                      mediaFiles: null,
                      metadata: null,
                    }),
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="border-b border-line last:border-b-0 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/c/${profile.company.slug}/post/${p.id}`}
                          className="block text-xs font-semibold text-fg tracking-wide truncate hover:underline"
                        >
                          {p.title ?? p.content.slice(0, 80)}
                          {!p.title && p.content.length > 80 ? "…" : ""}
                        </Link>
                        <span className="text-[10px] text-dim font-mono">
                          {p.type} · {fmtDate(p.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-dim shrink-0">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {p.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {p.commentCount}
                        </span>
                      </div>
                    </div>
                  ))
                : profile.posts
                    .slice(0, 1)
                    .map((p) => p)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="border-b border-line py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/c/${profile.company.slug}/post/${p.id}`}
                            className="block text-xs font-semibold text-fg tracking-wide truncate hover:underline"
                          >
                            {p.title ?? p.content.slice(0, 80)}
                            {!p.title && p.content.length > 80 ? "…" : ""}
                          </Link>
                          <span className="text-[10px] text-dim font-mono">
                            {p.type} · {fmtDate(p.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-dim shrink-0">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {p.likeCount ?? p._count?.reactions ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {p.commentCount ?? p._count?.comments ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
            </>
          )}

          {!showHistory && profile.posts && profile.posts.length > 1 && (
            <button
              onClick={() => setShowHistory(true)}
              className="btn text-xs w-full py-2.5 mt-4"
            >
              Show All {profile.posts.length} Posts
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}