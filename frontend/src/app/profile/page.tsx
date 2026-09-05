"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, authApi, profileApi, type Post, normPost, fmtDate } from "@/lib/api";
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
  Camera,
  Upload,
  X,
  Loader2,
  Zap,
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
  photoUrl?: string | null;
  emergencyUrl?: string | null;
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
  const { logout, refresh: refreshAuth } = useAuth();

  const [profile, setProfile] = useState<SelfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Emergency URL state
  const [emergencyUrl, setEmergencyUrl] = useState<string | null>(null);
  const [emergencySaved, setEmergencySaved] = useState<string | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [savingEmergency, setSavingEmergency] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api<SelfProfile>("/profile");
        setProfile(data);
        setEmergencyUrl(data.emergencyUrl || "");
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handleSaveEmergency = async () => {
    setEmergencyError(null);
    setEmergencySaved(null);
    setSavingEmergency(true);
    try {
      const value = emergencyUrl?.trim() || "";
      if (value && !/^https?:\/\//i.test(value)) {
        setEmergencyError("URL must start with http:// or https://");
        return;
      }
      const res = await profileApi.updateEmergencyUrl(value || null);
      setEmergencySaved("Emergency URL updated.");
      setEmergencyUrl(res.emergencyUrl || "");
      await refreshAuth(); // Update global auth context agar PanicButtonHandler langsung dapat URL baru
    } catch (err: unknown) {
      setEmergencyError((err as Error).message || "Failed to save.");
    } finally {
      setSavingEmergency(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    setPhotoSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be smaller than 5MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target?.result as string);
      setCropZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    setPhotoSuccess(null);
    try {
      const res = await profileApi.uploadPhoto(selectedFile);
      setProfile((prev) => (prev ? { ...prev, photoUrl: res.photoUrl } : prev));
      setPhotoSuccess("Avatar photo updated successfully.");
      setSelectedFile(null);
      setPreviewUrl(null);
      await refreshAuth();
    } catch (err: unknown) {
      setPhotoError((err as Error).message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const cancelPhotoSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        <div className="flex items-center gap-4">
          <div className="relative group w-14 h-14 bg-panel2 border border-line flex items-center justify-center overflow-hidden shrink-0">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Identicon seed={profile?.id || "anon"} size={48} />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo"
              className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-fg"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="label mb-1">// IDENTITY VAULT</div>
            <h1 className="text-xl font-bold tracking-tight text-fg uppercase">
              Account & Pseudonyms
            </h1>
            <p className="text-[11px] text-dim font-mono mt-1">
              SEALED REAL IDENTITY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Photo
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="btn btn-danger text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Terminate Session
          </button>
        </div>
      </div>

      {photoError && (
        <div className="mb-6 p-4 border border-danger bg-danger/10 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{photoError}</span>
        </div>
      )}

      {photoSuccess && (
        <div className="mb-6 p-4 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{photoSuccess}</span>
        </div>
      )}

      {/* Crop / Photo Preview Modal */}
      {previewUrl && (
        <div className="card p-6 border-fg/50 bg-panel mb-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <span className="label font-bold">// PREVIEW & CROP AVATAR</span>
            <button
              onClick={cancelPhotoSelection}
              className="text-dim hover:text-fg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 border-2 border-line bg-panel2 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={previewUrl}
                alt="Avatar Crop Preview"
                style={{
                  transform: `scale(${cropZoom})`,
                  objectFit: "cover",
                }}
                className="w-full h-full transition-transform duration-100"
              />
              <div className="absolute inset-0 pointer-events-none border border-fg/30 rounded-full" />
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="label block mb-1">Scale / Crop Zoom: {cropZoom.toFixed(1)}x</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-fg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void handlePhotoUpload()}
                  disabled={uploadingPhoto}
                  className="btn btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {uploadingPhoto ? "UPLOADING..." : "SAVE AVATAR PHOTO"}
                </button>
                <button
                  onClick={cancelPhotoSelection}
                  disabled={uploadingPhoto}
                  className="btn text-xs px-4"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* Emergency Panic Button Settings */}
          <div className="card p-6 border-line bg-panel">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-red-400" />
              <span className="label">Emergency Panic Button</span>
            </div>
            <p className="text-[11px] text-dim mb-3 leading-relaxed">
              Set a custom URL to instantly switch to when triggered (double-tap <kbd className="px-1 py-0.5 bg-panel2 border border-line rounded text-[10px]">ESC</kbd> or <kbd className="px-1 py-0.5 bg-panel2 border border-line rounded text-[10px]">Alt+X</kbd>).
              Leave empty for default (Google Sheets).
            </p>
            <div className="space-y-2">
              <input
                type="url"
                value={emergencyUrl || ""}
                onChange={(e) => setEmergencyUrl(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="input text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveEmergency()}
                  disabled={savingEmergency}
                  className="btn btn-primary flex-1 py-2 text-xs"
                >
                  {savingEmergency ? "Saving..." : "Save URL"}
                </button>
                <button
                  type="button"
                  onClick={() => setEmergencyUrl("")}
                  className="btn px-3 py-2 text-xs border-line"
                >
                  Reset
                </button>
              </div>
              {emergencyError && (
                <div className="text-[11px] text-red-400">{emergencyError}</div>
              )}
              {emergencySaved && (
                <div className="text-[11px] text-emerald-400">{emergencySaved}</div>
              )}
              <div className="text-[10px] text-dim font-mono mt-2 space-y-0.5">
                <div>• Trigger: Double ESC (within 400ms) or Alt+X</div>
                <div>• Uses <code className="text-fg">window.location.replace()</code> — no back button</div>
                <div>• Floating PANIC button always visible (bottom-right)</div>
              </div>
            </div>
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