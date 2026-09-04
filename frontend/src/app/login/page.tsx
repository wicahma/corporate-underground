"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { KeyRound, AlertCircle, ShieldAlert } from "lucide-react";
import { RedirectIfAuthenticated } from "@/components/RedirectIfAuthenticated";

export default function LoginPage() {
  return (
    <Shell>
      <Suspense fallback={<div className="max-w-sm mx-auto px-4 pt-24 pb-20"><div className="card p-8 border-line animate-pulse"><div className="h-4 bg-panel2 w-1/3 mb-2" /><div className="h-3 bg-panel2 w-2/3" /></div></div>}>
        <RedirectIfAuthenticated>
          <LoginForm />
        </RedirectIfAuthenticated>
      </Suspense>
    </Shell>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get("session_expired") === "1") {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.login(email, password);
      await refresh();
      router.push("/verify");
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 pt-24 pb-20">
      <div className="card p-8 border-line">
        <div className="mb-8">
          <div className="label mb-2">// ACCESS GATE</div>
          <h1 className="text-xl font-bold tracking-tight text-fg">
            SIGN IN
          </h1>
          <p className="text-[11px] text-dim mt-2 font-mono">
            Your real identity stays sealed. We only issue your session
            token.
          </p>
        </div>

          {sessionExpired && (
            <div className="mb-5 p-3 border border-amber-500/50 bg-amber-500/10 text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Session expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 border border-danger bg-danger/10 text-danger text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <label className="label block mb-1.5">EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label">PASSWORD</label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] text-neutral-400 hover:text-white transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-2"
            >
              {loading ? "AUTHENTICATING..." : "ENTER"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line flex items-center justify-between">
            <span className="text-[10px] text-dim font-mono flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" />
              NO ACCOUNT?
            </span>
            <Link
              href="/register"
              className="text-[10px] uppercase tracking-widest text-fg hover:underline"
            >
              REGISTER →
            </Link>
          </div>
        </div>
      </div>
  );
}
