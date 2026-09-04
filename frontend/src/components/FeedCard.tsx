"use client";

import { useState } from "react";
import Link from "next/link";
import { type Post, communityApi, fmtDate } from "@/lib/api";
import { Identicon } from "./Identicon";
import { PollWidget } from "./PollWidget";
import { RepostModal } from "./RepostModal";
import { showToast } from "@/lib/toast";
import {
  Heart,
  MessageSquare,
  Repeat2,
  Share2,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";

const TYPE_TAG: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "Note", tone: "text-dim border-line" },
  HOT_TAKE: { label: "Hot Take", tone: "text-amber-300 border-amber-500/40" },
  CONFESSION: { label: "Confession", tone: "text-rose-300 border-rose-500/40" },
  POLL: { label: "Poll", tone: "text-sky-300 border-sky-500/40" },
  AMA: { label: "AMA", tone: "text-emerald-300 border-emerald-500/40" },
  TIME_CAPSULE: { label: "Capsule", tone: "text-purple-300 border-purple-500/40" },
};

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

export function FeedCard({
  post,
  companySlug,
}: {
  post: Post;
  companySlug: string;
}) {
  const [likes, setLikes] = useState(post.likeCount);
  const [liked, setLiked] = useState(post.userLiked ?? false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const tag = TYPE_TAG[post.type] ?? TYPE_TAG.NORMAL;

  const isVerified = (post.metadata as Record<string, unknown> | null)?.verifiedEmployee ?? true;

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/c/${companySlug}/post/${post.id}`;
    const title = post.title || post.content.slice(0, 50);

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: post.content.slice(0, 100),
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard", "success");
      } catch {
        showToast("Failed to copy link", "error");
      }
    }
  };

  const actionBtn =
    "flex items-center gap-1.5 text-dim hover:text-fg p-2 -m-1 rounded-full transition-colors";

  return (
    <>
      <article className="card p-4 hover:border-fg/40 transition-colors">
        <div className="flex">
          {/* Left column: avatar + thread line */}
          <div className="w-10 flex flex-col items-center shrink-0">
            <Link
              href={`/u/${post.author.pseudonym}`}
              className="hover:opacity-80 transition-opacity"
            >
              <Identicon seed={post.author.avatarSeed || post.author.pseudonym} />
            </Link>
            <div className="w-[2px] flex-1 bg-[#262626] my-2 rounded-full min-h-[20px]" />
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0 pl-3">
            <header className="flex items-center gap-1.5 text-sm mb-1 flex-wrap">
              <Link
                href={`/u/${post.author.pseudonym}`}
                className="font-semibold text-[15px] text-[#f3f5f7] hover:underline"
              >
                {post.author.pseudonym}
              </Link>
              {isVerified ? (
                <BadgeCheck className="w-4 h-4 text-[#0095f6] shrink-0" />
              ) : (
                <span
                  className="tag text-[10px] border-amber-500/40 text-amber-300 bg-amber-500/10 flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
                  title="Pengguna ini belum memverifikasi status karyawannya"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  Unverified
                </span>
              )}
              <time className="text-[13px] text-[#777777]">
                {`• ${relativeTime(post.createdAt)}`}
              </time>
              <span className={`tag ${tag.tone} text-[10px]`}>{tag.label}</span>
            </header>

            {post.title && (
              <h2 className="text-[15px] font-semibold text-[#f3f5f7] mb-1">
                <Link
                  href={`/c/${companySlug}/post/${post.id}`}
                  className="hover:underline"
                >
                  {post.title}
                </Link>
              </h2>
            )}

            <p className="text-[15px] leading-relaxed text-[#f3f5f7] whitespace-pre-wrap font-normal">
              {post.content}
            </p>

            {post.type === "POLL" && post.pollOptions && (
              <div className="mt-3 max-w-md">
                <PollWidget
                  companySlug={companySlug}
                  postId={post.id}
                  options={post.pollOptions}
                />
              </div>
            )}

            <footer className="flex items-center gap-1 text-sm pt-1 mt-1 -ml-1">
              <button
                onClick={handleLike}
                className={actionBtn}
                aria-label="Like"
              >
                <Heart
                  className={`w-[18px] h-[18px] transition-colors ${
                    liked ? "fill-[#ff3040] text-[#ff3040]" : ""
                  }`}
                />
                <span className="text-[13px] font-medium text-dim">
                  {likes}
                </span>
              </button>

              <Link
                href={`/c/${companySlug}/post/${post.id}`}
                className={actionBtn}
                aria-label="Reply"
              >
                <MessageSquare className="w-[18px] h-[18px]" />
                <span className="text-[13px] font-medium text-dim">
                  {post.commentCount}
                </span>
              </Link>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRepostModal(true);
                }}
                className={actionBtn}
                aria-label="Repost"
              >
                <Repeat2 className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={handleShare}
                className={actionBtn}
                aria-label="Share"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>
            </footer>
          </div>
        </div>
      </article>

      {showRepostModal && (
        <RepostModal
          post={post}
          companySlug={companySlug}
          onClose={() => setShowRepostModal(false)}
        />
      )}
    </>
  );
}