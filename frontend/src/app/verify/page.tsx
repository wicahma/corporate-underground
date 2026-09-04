"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  companiesApi,
  verificationApi,
  type Company,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { RequireAuth } from "@/components/RequireAuth";
import { ShieldCheck, AlertCircle, Search, Hash, Loader2 } from "lucide-react";

type Mode = "company" | "otp" | "code";

export default function VerifyPage() {
  return (
    <RequireAuth>
      <Shell>
        <Suspense
          fallback={
            <div className="max-w-xl mx-auto px-4 pt-14 pb-20">
              <div className="card p-8 border-line animate-pulse space-y-4">
                <div className="h-4 bg-panel2 w-1/3" />
                <div className="h-3 bg-panel2 w-2/3" />
              </div>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </Shell>
    </RequireAuth>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  const [mode, setMode] = useState<Mode>("company");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [workEmail, setWorkEmail] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const slug = searchParams.get("company");
    if (slug) {
      companiesApi
        .bySlug(slug)
        .then((c) => {
          setSelected(c);
          setMode("company");
        })
        .catch(() => {});
    } else {
      companiesApi
        .list()
        .then((list) => setCompanies(list))
        .catch(() => setCompanies([]));
    }
  }, [searchParams]);

  const filtered = search
    ? companies.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : companies;

  const requestOtp = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verificationApi.requestEmail(selected.slug, workEmail);
      const rid = (res as Record<string, unknown>).requestId as string;
      if (!rid) throw new Error("Server returned no request ID.");
      setRequestId(rid);
      setMode("otp");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to request OTP.");
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!requestId) return;
    setBusy(true);
    setError(null);
    try {
      await verificationApi.verifyOtp(requestId, otp);
      setNotice("Membership verified. Redirecting to your compound...");
      await refresh();
      setTimeout(() => {
        if (selected) router.push(`/c/${selected.slug}`);
      }, 900);
    } catch (err: unknown) {
      setError((err as Error).message || "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const claimCode = async () => {
    if (!inviteCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verificationApi.claimCode(inviteCode.trim());
      await refresh();
      const companyData = res.company as { slug?: string } | undefined;
      const slug = companyData?.slug;
      if (slug) {
        router.push(`/c/${slug}`);
      } else {
        setNotice("Code accepted. Membership active.");
        setTimeout(() => router.push("/"), 900);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Code rejected.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-14 pb-20">
      <div className="mb-8">
        <div className="label mb-2">// COMPANY VERIFICATION</div>
        <h1 className="text-xl font-bold tracking-tight text-fg">
          PROVE YOU BELONG
        </h1>
        <p className="text-[11px] text-dim mt-2 font-mono leading-relaxed max-w-md">
          Each company community admits only verified employees. Your corporate
          email is checked against the company&apos;s allowed domains, then a
          time-limited OTP seals your membership.
        </p>
      </div>

      <div className="flex gap-1.5 mb-6">
        {(
          [
            ["company", "Email OTP"],
            ["code", "Secret Code"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`tab ${mode === m ? "tab-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-3 border border-danger bg-danger/10 text-danger text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 p-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[11px]">
          {notice}
        </div>
      )}

      {mode === "code" && (
        <div className="card p-6 border-line space-y-4">
          <div className="flex items-center gap-2 text-dim">
            <Hash className="w-4 h-4" />
            <span className="text-[11px] font-mono">
              Enter an invitation code issued by your community creator.
            </span>
          </div>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            className="input font-mono tracking-[0.3em] text-center uppercase"
          />
          <button
            onClick={() => void claimCode()}
            disabled={busy || !inviteCode.trim()}
            className="btn btn-primary w-full py-3"
          >
            {busy ? "VALIDATING..." : "CLAIM MEMBERSHIP"}
          </button>
        </div>
      )}

      {mode === "company" && (
        <div className="card p-6 border-line">
          {!selected && (
            <div>
              <div className="label mb-3">STEP 01 — FIND YOUR COMPANY</div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by company name or slug..."
                  className="input pl-9 text-xs"
                />
              </div>

              {companies.length === 0 && !busy ? (
                <p className="text-[11px] text-dim font-mono py-3">
                  No companies registered yet. Create one via the backend
                  console or ask your admin for a secret code.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-line divide-y divide-line">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-panel2 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold tracking-wider text-fg uppercase">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-dim font-mono">
                          /{c.slug} · {c.allowedDomains.join(" ")}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-dim shrink-0">
                        {c.members > 0 ? `${c.members} MEMBERS` : "OPEN"}
                      </span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-4 py-4 text-[11px] text-dim font-mono">
                      No match for &quot;{search}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selected && mode === "company" && !requestId && (
            <div>
              <div className="label mb-3">STEP 02 — CONFIRM WORK EMAIL</div>
              <div className="card bg-panel2 p-3 mb-4 border-line flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-fg">
                    {selected.name}
                  </span>
                  <span className="text-[10px] text-dim font-mono">
                    ALLOWED: {selected.allowedDomains.join(" · ")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelected(null);
                  setError(null);
                }}
                className="text-[10px] text-dim hover:text-fg mb-3 block"
              >
                ← CHANGE COMPANY
              </button>

              <input
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="jane.doe@company.com"
                className="input mb-4"
                type="email"
              />
              <button
                onClick={() => void requestOtp()}
                disabled={busy || !workEmail.includes("@")}
                className="btn btn-primary w-full py-3"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> SENDING
                    OTP...
                  </span>
                ) : (
                  "SEND VERIFICATION CODE"
                )}
              </button>
            </div>
          )}

          {selected && requestId && (
            <div>
              <div className="label mb-3">STEP 03 — ENTER 6-DIGIT OTP</div>
              <p className="text-[11px] text-dim font-mono mb-4">
                Verification code sent. It expires in 15 minutes.
              </p>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                maxLength={6}
                placeholder="000000"
                className="input font-mono tracking-[0.6em] text-center text-lg mb-4"
              />
              <button
                onClick={() => void confirmOtp()}
                disabled={busy || otp.length < 6}
                className="btn btn-primary w-full py-3"
              >
                {busy
                  ? "VERIFYING..."
                  : `VERIFY & ENTER ${selected.name.toUpperCase()}`}
              </button>
            </div>
          )}
        </div>
      )}

      {user && user.memberships.length > 0 && (
        <div className="mt-8">
          <div className="label mb-3">YOUR MEMBERSHIPS</div>
          <div className="card border-line divide-y divide-line">
            {user.memberships.map((m) => (
              <Link
                key={m.company.slug}
                href={`/c/${m.company.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-panel2 transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-fg">
                  {m.company.name}
                </span>
                <span className="text-[10px] font-mono text-dim">
                  {m.status}
                  {m.status === "VERIFIED" ? " →" : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}