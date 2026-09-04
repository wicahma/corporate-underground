"use client";

import { useState } from "react";
import { type Post, communityApi } from "@/lib/api";
import { Identicon } from "./Identicon";
import { showToast } from "@/lib/toast";
import { X, Repeat2, Loader2 } from "lucide-react";

export function RepostModal({
  post,
  companySlug,
  onClose,
  onReposted,
}: {
  post: Post;
  companySlug: string;
  onClose: () => void;
  onReposted?: () => void;
}) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRepost = async () => {
    setSubmitting(true);
    try {
      // Create a new post referencing the quoted original post
      const prefix = comment.trim() ? `${comment.trim()}\n\n` : "";
      const quoteBlock = `> Reposting @${post.author.pseudonym}:\n> "${post.content.slice(0, 200)}${post.content.length > 200 ? "..." : ""}"`;
      const fullContent = `${prefix}${quoteBlock}`;

      await communityApi.createPost(companySlug, {
        type: "NORMAL",
        title: post.title ? `Repost: ${post.title}` : undefined,
        content: fullContent,
        leakCheckConsent: true,
      });

      showToast("Thread reposted successfully", "success");
      onReposted?.();
      onClose();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to repost", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#101010]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-6 border-[#262626] bg-[#181818] rounded-2xl relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#777777] hover:text-[#f3f5f7] p-1.5 rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Repeat2 className="w-5 h-5 text-[#f3f5f7]" />
          <h3 className="text-base font-semibold text-[#f3f5f7]">
            Quote Thread
          </h3>
        </div>

        {/* User's commentary */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add your thoughts to this thread..."
          rows={3}
          className="w-full bg-[#101010] border border-[#262626] rounded-xl p-3 text-[15px] text-[#f3f5f7] placeholder-[#777777] outline-none focus:border-[#f3f5f7] transition-colors resize-none mb-4"
          autoFocus
        />

        {/* Quoted Post Preview */}
        <div className="border border-[#262626] rounded-xl p-4 bg-[#101010]/60 mb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Identicon seed={post.author.avatarSeed || post.author.pseudonym} size={20} />
            <span className="font-semibold text-xs text-[#f3f5f7]">
              {post.author.pseudonym}
            </span>
          </div>
          {post.title && (
            <div className="font-semibold text-xs text-[#f3f5f7] mb-1">
              {post.title}
            </div>
          )}
          <p className="text-xs text-[#777777] line-clamp-3 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRepost}
            disabled={submitting}
            className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Reposting...
              </>
            ) : (
              "Repost"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}