"use client";

import { useState } from "react";
import Link from "next/link";
import { type Post, communityApi, fmtDate } from "@/lib/api";
import { Identicon } from "./Identicon";
import { PollWidget } from "./PollWidget";
import { MessageSquare, ThumbsUp, Flame, Lock, Radio } from "lucide-react";

const TYPE_TAG: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "NOTE", tone: "text-dim border-line" },
  HOT_TAKE: { label: "HOT TAKE", tone: "text-amber-300 border-amber-500/40" },
  CONFESSION: { label: "CONFESSION", tone: "text-rose-300 border-rose-500/40" },
  POLL: { label: "POLL", tone: "text-sky-300 border-sky-500/40" },
  AMA: { label: "AMA", tone: "text-emerald-300 border-emerald-500/40" },
  TIME_CAPSULE: { label: "CAPSULE", tone: "text-purple-300 border-purple-500/40" },
};

export function FeedCard({
  post,
  companySlug,
}: {
  post: Post;
  companySlug: string;
}) {
  const [likes, setLikes] = useState(post.likeCount);
  const [liked, setLiked] = useState(false);
  const tag = TYPE_TAG[post.type] ?? TYPE_TAG.NORMAL;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await communityApi.react(companySlug, post.id, "LIKE");
      setLikes((n) => (liked ? n - 1 : n + 1));
      setLiked(!liked);
    } catch {
      /* fallback on unauthenticated */
    }
  };

  return (
    <article className="card p-5 hover:border-fg/40 transition-colors">
      <header className="flex items-center justify-between gap-3 text-xs mb-3 pb-3 border-b border-line">
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
        <div className="flex items-center gap-2">
          <span className={`tag ${tag.tone}`}>{tag.label}</span>
          <time className="text-[10px] text-dim font-mono">
            {fmtDate(post.createdAt)}
          </time>
        </div>
      </header>

      {post.title && (
        <h2 className="text-sm font-semibold text-fg tracking-wide mb-2">
          <Link
            href={`/c/${companySlug}/post/${post.id}`}
            className="hover:underline"
          >
            {post.title}
          </Link>
        </h2>
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

      <footer className="flex items-center justify-between text-xs pt-3 border-t border-line text-dim">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs hover:text-fg transition-colors ${
              liked ? "text-fg font-bold" : ""
            }`}
          >
            {post.type === "HOT_TAKE" ? (
              <Flame className="w-3.5 h-3.5" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5" />
            )}
            <span className="font-mono text-[11px]">{likes}</span>
          </button>

          <Link
            href={`/c/${companySlug}/post/${post.id}`}
            className="flex items-center gap-1.5 text-xs hover:text-fg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{post.commentCount}</span>
            <span className="hidden sm:inline text-[10px]">REPLIES</span>
          </Link>
        </div>

        <Link
          href={`/c/${companySlug}/post/${post.id}`}
          className="text-[10px] uppercase tracking-widest text-dim hover:text-fg"
        >
          OPEN THREAD →
        </Link>
      </footer>
    </article>
  );
}