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
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Send,
  AlertCircle,
  Flame,
} from "lucide-react";

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
      setComments((prev) => {
        if (parentId) {
          const insert = (list: Comment[]): Comment[] =>
            list.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...c.replies, created] }
                : { ...c, replies: insert(c.replies) },
            );
          return insert(prev);
        }
        return [...prev, created];
      });
    } catch {
      /* no-op */
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (c: Comment, depth = 0) => (
    <div key={c.id} className={`mb-4 ${depth > 0 ? "ml-6 border-l border-line pl-4" : ""}`}>
      <div className="flex items-start gap-3">
        <Identicon seed={c.author.avatarSeed || c.author.pseudonym} size={24} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-fg tracking-wider">
              {c.author.pseudonym}
            </span>
            <time className="text-[9px] text-dim font-mono">
              {fmtDate(c.createdAt)}
            </time>
          </div>
          <p className="text-xs text-fg/90 font-mono font-light leading-relaxed whitespace-pre-wrap mb-2">
            {c.content}
          </p>
          <button
            onClick={() => setReplyTo(c.id)}
            className="text-[10px] text-dim hover:text-fg uppercase tracking-widest"
          >
            REPLY →
          </button>
        </div>
      </div>
      {c.replies.length > 0 && (
        <div className="mt-3">{c.replies.map((r) => renderComment(r, depth + 1))}</div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header companySlug={companySlug} />
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

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header companySlug={companySlug} companyName={company?.name} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          <div className="card p-8 border-danger/40 bg-danger/5">
            <div className="flex items-center gap-3 text-danger text-xs mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">Thread unavailable</span>
            </div>
            <p className="text-[11px] text-dim font-mono">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header companySlug={companySlug} companyName={company?.name} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Link
          href={`/c/${companySlug}`}
          className="text-[10px] text-dim hover:text-fg uppercase tracking-widest flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Feed
        </Link>

        {/* Post */}
        <article className="card p-6 border-line mb-8">
          <header className="flex items-center justify-between gap-3 text-xs mb-4 pb-4 border-b border-line">
            <div className="flex items-center gap-2.5">
              <Identicon seed={post.author.avatarSeed || post.author.pseudonym} />
              <div className="flex flex-col">
                <span className="font-semibold text-fg text-xs tracking-wider">
                  {post.author.pseudonym}
                </span>
                <span className="text-[10px] text-dim font-mono">
                  REP {post.author.reputation}
                </span>
              </div>
            </div>
            <time className="text-[10px] text-dim font-mono">
              {fmtDate(post.createdAt)}
            </time>
          </header>

          {post.title && (
            <h1 className="text-lg font-bold text-fg tracking-wide mb-3">
              {post.title}
            </h1>
          )}

          <p className="text-xs text-fg/90 whitespace-pre-wrap leading-relaxed font-mono font-light mb-4">
            {post.content}
          </p>

          {post.type === "POLL" && post.pollOptions && (
            <div className="my-4">
              <PollWidget
                companySlug={companySlug}
                postId={post.id}
                options={post.pollOptions}
              />
            </div>
          )}

          <footer className="flex items-center gap-4 text-xs pt-4 border-t border-line text-dim">
            <button className="flex items-center gap-1.5 text-xs hover:text-fg transition-colors">
              {post.type === "HOT_TAKE" ? (
                <Flame className="w-3.5 h-3.5" />
              ) : (
                <ThumbsUp className="w-3.5 h-3.5" />
              )}
              <span className="font-mono text-[11px]">{post.likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">{post.commentCount}</span>
              <span className="text-[10px]">REPLIES</span>
            </div>
          </footer>
        </article>

        {/* Comments */}
        <div className="card p-6 border-line">
          <div className="label mb-4">DISCUSSION THREAD</div>

          {/* Comment Form */}
          <div className="mb-6 pb-6 border-b border-line">
            {replyTo && (
              <div className="mb-2 text-[10px] text-dim flex items-center gap-2">
                <span>Replying to #{replyTo.slice(0, 8)}</span>
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
              placeholder="Add your anonymous reply..."
              rows={3}
              className="input resize-y text-xs font-mono font-light leading-relaxed mb-3"
            />
            <button
              onClick={() => void submitComment(replyTo ?? undefined)}
              disabled={submitting || !newComment.trim()}
              className="btn btn-primary text-xs flex items-center gap-2"
            >
              <Send className="w-3 h-3" />
              {submitting ? "POSTING..." : "POST REPLY"}
            </button>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {comments.length === 0 && (
              <p className="text-[11px] text-dim font-mono text-center py-8">
                No replies yet. Start the conversation.
              </p>
            )}
            {comments.map((c) => renderComment(c))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}