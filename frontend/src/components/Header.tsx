"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ArrowRight, LogOut, User, Menu, X, Radio, Shield } from "lucide-react";
import { LogoutModal } from "./LogoutModal";

export function Header({
  companySlug,
  companyName,
}: {
  companySlug?: string;
  companyName?: string;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = async () => {
    setConfirmOpen(false);
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#101010]/80 border-b border-[#262626]">
      <div className="max-w-[640px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left spacer for symmetry */}
        <div className="w-10" />

        {/* Centered title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={companySlug ? `/c/${companySlug}` : "/"}
            onClick={close}
            className="font-bold text-[15px] text-[#f3f5f7] hover:opacity-80 truncate"
          >
            {companyName ?? "Corporate Underground"}
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          {companySlug && (
            <Link
              href={`/c/${companySlug}/pulse`}
              onClick={close}
              title="Pulse"
              className="p-2 rounded-full text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5 transition-colors"
            >
              <Radio className="w-5 h-5" />
            </Link>
          )}
          <Link
            href="/verify"
            onClick={close}
            title="Verify"
            className="p-2 rounded-full text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5 transition-colors"
          >
            <Shield className="w-5 h-5" />
          </Link>
          {user ? (
            <Link
              href="/profile"
              onClick={close}
              title="Profile"
              className="p-2 rounded-full text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5 transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="rounded-full bg-white text-black font-semibold text-xs px-3 py-1.5 hover:bg-white/90 transition-colors"
            >
              Enter
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#262626]">
          <nav className="max-w-[640px] mx-auto px-4 py-3 flex flex-col items-stretch gap-1">
            {companySlug && (
              <Link
                href={`/c/${companySlug}`}
                onClick={close}
                className="px-4 py-2.5 rounded-xl text-sm text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5"
              >
                Feed
              </Link>
            )}
            {companySlug && (
              <Link
                href={`/c/${companySlug}/pulse`}
                onClick={close}
                className="px-4 py-2.5 rounded-xl text-sm text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5"
              >
                Pulse
              </Link>
            )}
            <Link
              href="/verify"
              onClick={close}
              className="px-4 py-2.5 rounded-xl text-sm text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5"
            >
              Verify
            </Link>
            {user && (
              <Link
                href="/profile"
                onClick={close}
                className="px-4 py-2.5 rounded-xl text-sm text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5"
              >
                Profile
              </Link>
            )}
            {user ? (
              <button
                onClick={() => {
                  close();
                  setConfirmOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-sm text-[#777777] hover:text-[#f3f5f7] hover:bg-white/5 flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" />
                Exit
              </button>
            ) : (
              <Link
                href="/login"
                onClick={close}
                className="rounded-full bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-white/90 text-center"
              >
                Enter
              </Link>
            )}
          </nav>
        </div>
      )}

      {confirmOpen && (
        <LogoutModal
          onConfirm={() => void handleLogout()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </header>
  );
}