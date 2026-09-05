"use client";

import { useState, useRef } from "react";
import { type PostType, communityApi, privacyApi, type LeakResult, type Post } from "@/lib/api";
import { LeakDetectorModal } from "./LeakDetectorModal";
import { ImageUpload, type UploadedImage, type ImageUploadHandle } from "./ImageUpload";
import { Identicon } from "./Identicon";
import { useAuth } from "@/lib/auth";
import { AlertCircle, Plus, Trash2, Image as ImageIcon } from "lucide-react";

export function PostCreator({
  companySlug,
  onCreated,
}: {
  companySlug: string;
  onCreated: (post: Post) => void;
}) {
  const { user } = useAuth();
  const [type, setType] = useState<PostType>("NORMAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [leakResult, setLeakResult] = useState<LeakResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUploadRef = useRef<ImageUploadHandle>(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const runPublish = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Auto-upload any pending images selected in dropzone before submitting post
      let finalImages = [...images];
      if (imageUploadRef.current && imageUploadRef.current.hasPending()) {
        const newlyUploaded = await imageUploadRef.current.uploadPendingImages();
        finalImages = [...finalImages, ...newlyUploaded];
      }

      const validOptions =
        type === "POLL" ? pollOptions.filter((o) => o.trim().length > 0) : undefined;

      const created = await communityApi.createPost(companySlug, {
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        pollOptions: validOptions,
        mediaIds: finalImages.map((img) => img.id),
        leakCheckConsent: true,
      });

      setTitle("");
      setContent("");
      setPollOptions(["", ""]);
      setImages([]);
      setShowImageUpload(false);
      setType("NORMAL");
      setLeakResult(null);
      onCreated(created);
    } catch (err: unknown) {
      const e = err as Error;
      const isLeakBlock = (e as unknown as { leak?: LeakResult }).leak;
      if (isLeakBlock) {
        setLeakResult(isLeakBlock);
      } else {
        setError(e.message || "Failed to publish post. Ensure you are verified.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pseudonym = user?.id ?? "anon";

  return (
    <div className="card p-4 mb-6 border-line bg-panel">
      {leakResult && (
        <LeakDetectorModal
          leak={leakResult}
          onClose={() => setLeakResult(null)}
        />
      )}

      {error && (
        <div className="mb-3 p-3 rounded-xl border border-danger bg-danger/10 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Left column: Avatar + connecting line */}
        <div className="w-10 flex flex-col items-center shrink-0">
          <Identicon seed={pseudonym} size={36} />
          <div className="w-[2px] flex-1 bg-[#262626] my-2 rounded-full min-h-[24px]" />
        </div>

        {/* Right column: Composer */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[13px] font-semibold text-fg">
              {pseudonym}
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["NORMAL", "Note"],
                  ["HOT_TAKE", "Hot Take"],
                  ["CONFESSION", "Confession"],
                  ["POLL", "Poll"],
                ] as [PostType, string][]
              ).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`tab text-xs py-1 px-2.5 ${type === t ? "tab-active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-line py-1.5 text-sm font-semibold text-fg placeholder:text-dim outline-none mb-2 focus:border-fg/50"
            maxLength={120}
          />

          <textarea
            placeholder={
              type === "HOT_TAKE"
                ? "Drop an unfiltered hot take..."
                : type === "CONFESSION"
                  ? "Confess something anonymously..."
                  : "Start a thread..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-transparent resize-none text-[15px] leading-relaxed text-fg placeholder:text-dim outline-none mb-2"
          />

          {type === "POLL" && (
            <div className="p-3 bg-panel2 border border-line rounded-xl space-y-2 mb-3">
              <div className="label">Poll Options</div>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleUpdatePollOption(idx, e.target.value)}
                    className="input text-xs py-2"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="text-dim hover:text-danger p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="btn text-xs py-1 px-3 flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3 h-3" /> Add Option
                </button>
              )}
            </div>
          )}

          {/* Image Upload Section */}
          <div className="pt-2 border-t border-line/40 flex flex-col gap-2">
            {showImageUpload && (
              <div className="py-2">
                <ImageUpload
                  ref={imageUploadRef}
                  onUploadComplete={(uploadedImages) => {
                    setImages([...images, ...uploadedImages]);
                  }}
                />
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-line">
                    <img
                      src={img.url}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="text-dim hover:text-fg p-1.5 rounded-full hover:bg-white/5 transition-colors flex items-center gap-1 text-xs"
                title="Attach Images"
              >
                <ImageIcon className="w-4 h-4" />
                {images.length > 0 && <span>({images.length})</span>}
              </button>

              <button
                type="button"
                disabled={!content.trim() || loading}
                onClick={() => void runPublish()}
                className="rounded-full bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 disabled:opacity-40 transition-colors"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}