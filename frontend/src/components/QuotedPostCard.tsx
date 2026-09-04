"use client";

import { Identicon } from "./Identicon";
import { Repeat2 } from "lucide-react";

export function QuotedPostCard({
  author,
  content,
}: {
  author: string;
  content: string;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[#2c2c2e] bg-[#141414] p-3.5 hover:border-[#3a3a3c] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Identicon seed={author} size={20} />
        <span className="font-semibold text-xs text-[#f3f5f7]">
          {author}
        </span>
        <span className="text-[10px] text-[#777777] flex items-center gap-1 ml-auto">
          <Repeat2 className="w-3 h-3 text-[#777777]" />
          Original Thread
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-[#c7c7cc] whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}