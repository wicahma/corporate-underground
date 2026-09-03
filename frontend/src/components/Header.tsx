"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Shield, Radio, ArrowRight, LogOut, Terminal } from "lucide-react";

export function Header({
  companySlug,
  companyName,
}: {
  companySlug?: string;
  companyName?: string;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line bg-ink/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={companySlug ? `/c/${companySlug}` : "/"}
            className="flex items-center gap-2 font-bold tracking-wider text-xs uppercase hover:opacity-80"
          >
            <Terminal className="w-4 h-4 text-fg" />
            <span>Corporate Underground</span>
          </Link>
          {companySlug && (
            <>
              <span className="text-dim text-xs">/</span>
              <span className="text-xs uppercase tracking-widest text-fg font-semibold truncate max-w-[180px]">
                {companyName ?? companySlug}
              </span>
            </>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {companySlug && (
            <>
              <Link
                href={`/c/${companySlug}`}
                className="btn text-[10px] py-1 px-2.5 h-8"
              >
                Feed
              </Link>
              <Link
                href={`/c/${companySlug}/pulse`}
                className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5"
              >
                <Radio className="w-3 h-3 text-dim" />
                Pulse
              </Link>
            </>
          )}

          <Link
            href="/verify"
            className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5"
          >
            <Shield className="w-3 h-3 text-dim" />
            Verify
          </Link>

          {user ? (
            <button
              onClick={logout}
              title={`Logged in as ${user.email}`}
              className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5 text-dim hover:text-fg"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary text-[10px] py-1 px-3 h-8 flex items-center gap-1.5"
            >
              Enter
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}