"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { KeyRound, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(email, password);
      const token = (res as Record<string, unknown>).accessToken ?? (res as Record<string, unknown>).token;
      if (!token) throw new Error("No access token returned by server.");
      tokenStore.set(String(token));
      await refresh();
      router.push("/verify");
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
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
              <label className="label block mb-1.5">PASSWORD</label>
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
    </Shell>
  );
}