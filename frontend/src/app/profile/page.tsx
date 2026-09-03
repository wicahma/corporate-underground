"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, authApi, type Post, normPost, fmtDate } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Shell } from "@/components/Shell";
import { Identicon } from "@/components/Identicon";
import { LogoutModal } from "@/components/LogoutModal";
import {
  KeyRound,
  LogOut,
  Building2,
  Shield,
  ThumbsUp,
  MessageSquare,
  Award,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface SelfMembership {
  id: string;
  status: string;
  company: {
    id: string;
    slug: string;
    name: string;
    logoUrl?: string;
  };
  anonymousIdentity?: {
    id: string;
    pseudonym: string;
    avatarSeed: string;
    reputation: number;
    _count?: {
      posts: number;
      comments: number;
      reactions: number;
      pollVotes: number;
    };
  };
}

interface SelfProfile {
  id: string;
  email: string;
  createdAt: string;
  memberships: SelfMembership[];
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Shell>
        <ProfileContent />
      </Shell>
    </RequireAuth>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { logout } = useAuth();

  const [profile, setProfile] = useState<SelfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api<SelfProfile>("/profile");
        setProfile(data);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setPwSuccess("Password successfully updated.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwError((err as Error).message || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
        <div className="card p-8 border-line animate-pulse space-y-4">
          <div className="h-4 bg-panel2 w-1/3" />
          <div className="h-3 bg-panel2 w-2/3" />
          <div className="h-3 bg-panel2 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-line">
        <div>
          <div className="label mb-1">// IDENTITY VAULT</div>
          <h1 className="text-xl font-bold tracking-tight text-fg uppercase">
            Account & Pseudonyms
          </h1>
          <p className="text-[11px] text-dim font-mono mt-1">
            {profile?.email} · SEALED REAL IDENTITY
          </p>
        </div>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="btn btn-danger text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Terminate Session
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-danger bg-danger/10 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left 2 Cols: Memberships & Pseudonyms */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="label mb-3">YOUR ACTIVE PSEUDONYMS BY COMPOUND</div>
            {profile?.memberships.length === 0 ? (
              <div className="card p-6 border-line text-center">
                <p className="text-xs text-dim font-mono mb-4">
                  You haven&apos;t joined any company compounds yet.
                </p>
                <Link href="/verify" className="btn btn-primary text-xs">
                  Verify & Join
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.memberships.map((m) => {
                  const ident = m.anonymousIdentity;
                  return (
                    <div
                      key={m.id}
                      className="card p-5 border-line bg-panel hover:border-fg/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-line">
                        <div className="flex items-center gap-3">
                          <Identicon
                            seed={ident?.avatarSeed || ident?.pseudonym || m.company.name}
                            size={32}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-fg tracking-wide">
                                {ident?.pseudonym ?? "PENDING ANONYMIZATION"}
                              </span>
                              <span
                                className={`tag ${
                                  m.status === "VERIFIED"
                                    ? "text-emerald-300 border-emerald-500/40"
                                    : "text-amber-300 border-amber-500/40"
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                            <Link
                              href={`/c/${m.company.slug}`}
                              className="text-[11px] text-dim hover:text-fg font-mono block mt-0.5"
                            >
                              Compound: /{m.company.slug} ({m.company.name}) →
                            </Link>
                          </div>
                        </div>

                        {ident && (
                          <Link
                            href={`/u/${ident.id}`}
                            className="btn text-[10px] py-1 px-2 shrink-0"
                          >
                            Public View →
                          </Link>
                        )}
                      </div>

                      {ident ? (
                        <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                          <div className="bg-panel2 p-2 border border-line">
                            <div className="text-xs font-bold text-fg">
                              {ident.reputation}
                            </div>
                            <div className="text-[9px] text-dim uppercase tracking-wider mt-0.5">
                              Reputation
                            </div>
                          </div>
                          <div className="bg-panel2 p-2 border border-line">
                            <div className="text-xs font-bold text-fg">
                              {ident._count?.posts ?? 0}
                            </div>
                            <div className="text-[9px] text-dim uppercase tracking-wider mt-0.5">
                              Posts
                            </div>
                          </div>
                          <div className="bg-panel2 p-2 border border-line">
                            <div className="text-xs font-bold text-fg">
                              {ident._count?.comments ?? 0}
                            </div>
                            <div className="text-[9px] text-dim uppercase tracking-wider mt-0.5">
                              Comments
                            </div>
                          </div>
                          <div className="bg-panel2 p-2 border border-line">
                            <div className="text-xs font-bold text-fg">
                              {ident._count?.pollVotes ?? 0}
                            </div>
                            <div className="text-[9px] text-dim uppercase tracking-wider mt-0.5">
                              Votes
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-dim font-mono">
                          Verify company email to mint an anonymous pseudonym.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Password Change & Security */}
        <div className="space-y-6">
          <div className="card p-6 border-line bg-panel">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-dim" />
              <span className="label">Change Master Password</span>
            </div>

            {pwError && (
              <div className="mb-4 p-3 border border-danger bg-danger/10 text-danger text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}
            {pwSuccess && (
              <div className="mb-4 p-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={(e) => void handlePasswordChange(e)} className="space-y-3">
              <div>
                <label className="label block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading || !oldPassword || !newPassword}
                className="btn btn-primary w-full py-2.5 text-xs mt-2"
              >
                {pwLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          <div className="card p-5 border-line bg-panel2 space-y-2">
            <div className="label">// CRYPTOGRAPHIC GUARANTEE</div>
            <p className="text-[11px] text-dim font-mono leading-relaxed">
              Your real email is salted, hashed, and detached from your
              pseudonyms. Even server administrators cannot link your company
              pseudonym to your real email.
            </p>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => void handleLogout()}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}