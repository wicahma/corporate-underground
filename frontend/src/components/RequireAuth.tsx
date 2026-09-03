"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto px-4 pt-14 pb-20">
          <div className="card p-8 border-line animate-pulse space-y-4">
            <div className="h-4 bg-panel2 w-1/3" />
            <div className="h-3 bg-panel2 w-2/3" />
          </div>
        </div>
      </Shell>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}