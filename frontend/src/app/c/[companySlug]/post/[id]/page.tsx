"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  companiesApi,
  communityApi,
  type Company,
  type Post,
  type Comment,
  buildCommentTree,
  fmtDate,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Identicon } from "@/components/Identicon";
import { PollWidget } from "@/components/PollWidget";
import { QuotedPostCard } from "@/components/QuotedPostCard";
import { parseQuotedPost } from "@/lib/parseQuotedPost";
import { useCommunitySSE } from "@/hooks/useCommunitySSE";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Repeat2,
  Share2,
  BadgeCheck,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return fmtDate(iso);
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ companySlug: string; id: string }>;
}) {
  const { companySlug, id } = use(params);

  const [company, setCompany] = useState<Company | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useCommunitySSE(companySlug, (event) => {
    if (event.type === "POST_LIKED" && event.postId === id) {
      setPost((prev) => (prev ? { ...prev, likeCount: event.likeCount } : prev));
    } else if (event.type === "POST_COMMENTED" && event.postId === id) {
      setPost((prev) => (prev ? { ...prev, commentCount: event.commentCount } : prev));
      if (event.comment) {
        setComments((prev) => {
          const raw = event.comment as Comment;
          if (prev.some((c) => c.id === raw.id)) return prev;
          const normalized: Comment = {
            ...raw,
            replies: raw.replies ?? [],
          };
          return [...prev, normalized];
        });
      }
    }
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [c, rawPost] = await Promise.all([
          companiesApi.bySlug(companySlug).catch(() => ({
            id: "",
            name: companySlug.toUpperCase(),
            slug: companySlug,
            allowedDomains: [],
            logoUrl: null,
            members: 0,
          })),
          communityApi.post(companySlug, id),
        ]);
        setCompany(c);
        setPost({
          id: (rawPost.id as string) ?? id,
          type: (rawPost.type as Post["type"]) ?? "NORMAL",
          title: (rawPost.title as string) ?? null,
          content: (rawPost.content as string) ?? "",
          likeCount: (rawPost.likeCount as number) ?? 0,
          commentCount: (rawPost.commentCount as number) ?? 0,
          createdAt:
            (rawPost.createdAt as string) ?? new Date().toISOString(),
          author: {
            pseudonym:
              ((rawPost.author as Record<string, unknown>)?.pseudonym as string) ??
              "ANON",
            avatarSeed:
              ((rawPost.author as Record<string, unknown>)?.avatarSeed as string) ??
              "anon",
            reputation:
              ((rawPost.author as Record<string, unknown>)?.reputation as number) ??
              0,
          },
          mediaFiles: Array.isArray(rawPost.mediaFiles)
            ? (rawPost.mediaFiles as Record<string, unknown>[]).map((m) => ({
                id: (m.id as string) ?? "",
                objectKey: (m.objectKey as string) ?? "",
                mimeType: (m.mimeType as string) ?? "",
                width: (m.width as number) ?? null,
                height: (m.height as number) ?? null,
              }))
            : null,
          pollOptions: Array.isArray(rawPost.pollOptions)
            ? (rawPost.pollOptions as Record<string, unknown>[]).map((o) => ({
                id: (o.id as string) ?? "",
                text: (o.text as string) ?? "",
                voteCount: (o.voteCount as number) ?? 0,
              }))
            : null,
          metadata: (rawPost.metadata as Record<string, unknown>) ?? null,
        });

        const rawComments = Array.isArray(rawPost.comments)
          ? rawPost.comments
          : [];
        setComments(buildCommentTree(rawComments));
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load thread.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [companySlug, id]);

  const submitComment = async (parentId?: string) => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const created = await communityApi.comment(
        companySlug,
        id,
        newComment.trim(),
        parentId,
      );
      setNewComment("");
      setReplyTo(null);
      // Normalize: ensure replies array exists to avoid render crash
      const normalized: Comment = { ...created, replies: [] };
      setComments((prev) => {
        if (parentId) {
          const insert = (list: Comment[]): Comment[] =>
            list.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...c.replies, normalized] }
                : { ...c, replies: insert(c.replies) },
            );
          return insert(prev);
        }
        return [...prev, normalized];
      });
      // Refetch full thread so client/server commentCount, tree, and
      // verified badges stay in sync (no refresh needed).
      try {
        const rawPost = await communityApi.post(companySlug, id);
        const rawComments = Array.isArray(rawPost.comments)
          ? rawPost.comments
          : [];
        setComments(buildCommentTree(rawComments));
        setPost((prev) =>
          prev
            ? {
                ...prev,
                commentCount: (rawPost.commentCount as number) ?? prev.commentCount,
                metadata:
                  ((rawPost.metadata as Record<string, unknown>) ?? null) ??
                  prev.metadata,
              }
            : prev,
        );
      } catch {
        // Optimistic state already applied; silent fallback
      }
    } catch {
      /* no-op */
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (c: Comment, depth = 0) => {
    const isVerified = (c as unknown as { metadata?: { verifiedEmployee?: boolean } })
      ?.metadata?.verifiedEmployee ?? true;
    return (
      <div key={c.id} className="flex mb-4">
        {/* Left column: avatar + thread line */}
        <div className="w-10 flex flex-col items-center shrink-0">
          <Identicon seed={c.author.avatarSeed || c.author.pseudonym} size={28} />
          <div className="w-[2px] flex-1 bg-[#262626] my-2 rounded-full min-h-[20px]" />
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-0 pl-3">
          <div className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
            <span className="font-semibold text-[15px] text-[#f3f5f7]">
              {c.author.pseudonym}
            </span>
            {isVerified ? (
              <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6] shrink-0" />
            ) : (
              <span className="tag text-[9px] border-amber-500/40 text-amber-300 bg-amber-500/10 flex items-center gap-1 font-medium px-1.5 py-0.2 rounded-full">
                <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                Unverified
              </span>
            )}
            <time className="text-[13px] text-[#777777]">
              {`• ${relativeTime(c.createdAt)}`}
            </time>
          </div>
          <p className="text-[15px] leading-relaxed text-[#f3f5f7] whitespace-pre-wrap font-normal mb-2">
            {c.content}
          </p>
          <button
            onClick={() => setReplyTo(c.id)}
            className="text-[13px] text-[#777777] hover:text-[#f3f5f7] transition-colors flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reply
          </button>

          {c.replies.length > 0 && (
            <div className="mt-3 space-y-0">
              {c.replies.map((r) => renderComment(r, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#101010]">
        <Header companySlug={companySlug} />
        <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-8">
          <div className="card p-6 border-line animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-panel2" />
              <div className="h-4 bg-panel2 w-1/3 rounded-full" />
            </div>
            <div className="h-3 bg-panel2 w-full rounded-full" />
            <div className="h-3 bg-panel2 w-2/3 rounded-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col bg-[#101010]">
        <Header companySlug={companySlug} companyName={company?.name} />
        <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-8">
          <div className="card p-6 border-danger/40 bg-danger/5">
            <div className="flex items-center gap-2 text-danger text-sm mb-1 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Thread unavailable</span>
            </div>
            <p className="text-xs text-dim">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isVerified = (post.metadata as Record<string, unknown> | null)?.verifiedEmployee ?? true;
  const actionBtn =
    "flex items-center gap-1.5 text-[#777777] hover:text-[#f3f5f7] p-2 -m-1 rounded-full transition-colors";

  return (
    <div className="flex min-h-screen flex-col bg-[#101010]">
      <Header companySlug={companySlug} companyName={company?.name} />

      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 py-6">
        <Link
          href={`/c/${companySlug}`}
          className="text-xs text-[#777777] hover:text-[#f3f5f7] flex items-center gap-1.5 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>

        {/* Post with thread line */}
        <article className="mb-6">
          <div className="flex">
            {/* Left column: avatar + thread line */}
            <div className="w-10 flex flex-col items-center shrink-0">
              <Identicon seed={post.author.avatarSeed || post.author.pseudonym} />
              <div className="w-[2px] flex-1 bg-[#262626] my-2 rounded-full min-h-[20px]" />
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-0 pl-3">
              <header className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
                <span className="font-semibold text-[15px] text-[#f3f5f7]">
                  {post.author.pseudonym}
                </span>
                {isVerified ? (
                  <BadgeCheck className="w-4 h-4 text-[#0095f6] shrink-0" />
                ) : (
                  <span className="tag text-[10px] border-rose-500/40 text-rose-400 bg-rose-500/10 flex items-center gap-1">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    Not an Employee
                  </span>
                )}
                <time className="text-[13px] text-[#777777]">
                  {`• ${relativeTime(post.createdAt)}`}
                </time>
              </header>

              {post.title && (
                <h1 className="text-[17px] font-bold text-[#f3f5f7] mb-2">
                  {post.title}
                </h1>
              )}

              <p className="text-[15px] leading-relaxed text-[#f3f5f7] whitespace-pre-wrap font-normal mb-3">
                {parseQuotedPost(post.content).mainText || post.content}
              </p>

              {parseQuotedPost(post.content).quote && (
                <div className="mb-3">
                  <QuotedPostCard
                    author={parseQuotedPost(post.content).quote!.author}
                    content={parseQuotedPost(post.content).quote!.text}
                  />
                </div>
              )}

              {post.mediaFiles && post.mediaFiles.length > 0 && (
                <div className="my-3 grid gap-2 grid-cols-1 sm:grid-cols-2 rounded-xl overflow-hidden border border-line">
                  {post.mediaFiles.map((media) => (
                    <div key={media.id} className="relative aspect-auto bg-black/20 flex items-center justify-center max-h-[400px] overflow-hidden">
                      <img
                        src={`/api/public/media/${media.objectKey}`}
                        alt="Attached media"
                        className="w-full h-auto object-cover max-h-[400px] rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
                        onClick={() =>
                          window.open(`/api/public/media/${media.objectKey}`, "_blank")
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {post.type === "POLL" && post.pollOptions && (
                <div className="my-3 max-w-md">
                  <PollWidget
                    companySlug={companySlug}
                    postId={post.id}
                    options={post.pollOptions}
                  />
                </div>
              )}

              <footer className="flex items-center gap-1 text-sm pt-1 -ml-1 border-b border-[#262626] pb-4 mb-4">
                <button className={actionBtn} aria-label="Like">
                  <Heart className="w-[18px] h-[18px]" />
                  <span className="text-[13px] font-medium text-[#777777]">
                    {post.likeCount}
                  </span>
                </button>
                <div className={actionBtn} aria-label="Comments">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  <span className="text-[13px] font-medium text-[#777777]">
                    {post.commentCount}
                  </span>
                </div>
                <button className={actionBtn} aria-label="Repost">
                  <Repeat2 className="w-[18px] h-[18px]" />
                </button>
                <button className={actionBtn} aria-label="Share">
                  <Share2 className="w-[18px] h-[18px]" />
                </button>
              </footer>
            </div>
          </div>
        </article>

        {/* Reply input */}
        <div className="card p-4 border-line mb-6">
          {replyTo && (
            <div className="mb-2 text-xs text-[#777777] flex items-center gap-2">
              <span>Replying to thread</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-danger hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Post your reply..."
            rows={3}
            className="w-full bg-transparent resize-none text-[15px] leading-relaxed text-[#f3f5f7] placeholder:text-[#777777] outline-none mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={() => void submitComment(replyTo ?? undefined)}
              disabled={submitting || !newComment.trim()}
              className="rounded-full bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 disabled:opacity-40 transition-colors"
            >
              {submitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>

        {/* Comments with thread lines */}
        <div>
          {comments.length === 0 && (
            <p className="text-sm text-[#777777] text-center py-8">
              No replies yet. Start the conversation.
            </p>
          )}
          {comments.map((c) => renderComment(c))}
        </div>
      </main>

      <Footer />
    </div>
  );
}