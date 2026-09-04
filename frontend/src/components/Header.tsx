"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Shield, Radio, ArrowRight, LogOut, Terminal, User, Menu, X } from "lucide-react";
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

  const navItems = (
    <>
      {companySlug && (
        <>
          <Link
            href={`/c/${companySlug}`}
            onClick={() => setMenuOpen(false)}
            className="btn text-[10px] py-1 px-2.5 h-8"
          >
            Feed
          </Link>
          <Link
            href={`/c/${companySlug}/pulse`}
            onClick={() => setMenuOpen(false)}
            className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5"
          >
            <Radio className="w-3 h-3 text-dim" />
            Pulse
          </Link>
        </>
      )}

      <Link
        href="/verify"
        onClick={() => setMenuOpen(false)}
        className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5"
      >
        <Shield className="w-3 h-3 text-dim" />
        Verify
      </Link>

      {user && (
        <Link
          href="/profile"
          onClick={() => setMenuOpen(false)}
          className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5"
        >
          <User className="w-3 h-3 text-dim" />
          Profile
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b border-line bg-ink/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={companySlug ? `/c/${companySlug}` : "/"}
            className="flex items-center gap-2 font-bold tracking-wider text-xs uppercase hover:opacity-80 shrink-0"
          >
            <Terminal className="w-4 h-4 text-fg" />
            <span className="hidden sm:inline">Corporate Underground</span>
            <span className="sm:hidden">CU</span>
          </Link>
          {companySlug && (
            <>
              <span className="text-dim text-xs">/</span>
              <span className="text-xs uppercase tracking-widest text-fg font-semibold truncate max-w-[120px] sm:max-w-[180px]">
                {companyName ?? companySlug}
              </span>
            </>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems}
          {user ? (
            <button
              onClick={() => setConfirmOpen(true)}
              title={`Logged in as ${user.id}`}
              className="btn text-[10px] py-1 px-2.5 h-8 flex items-center gap-1.5 text-dim hover:text-fg"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden btn p-2 h-8 w-8"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-line bg-ink/95">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col items-stretch gap-2">
            {navItems}
            {user ? (
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn text-[10px] py-2 h-8 flex items-center gap-1.5 text-dim hover:text-fg justify-center"
              >
                <LogOut className="w-3 h-3" />
                Exit
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary text-[10px] py-2 h-8 flex items-center gap-1.5 justify-center"
              >
                Enter
                <ArrowRight className="w-3 h-3" />
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