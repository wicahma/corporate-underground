"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RedirectIfAuthenticated({
  children,
  to = "/profile",
}: {
  children: React.ReactNode;
  to?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(to);
    }
  }, [user, loading, router, to]);

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-24 pb-20">
        <div className="card p-8 border-line animate-pulse">
          <div className="h-4 bg-panel2 w-1/3 mb-2" />
          <div className="h-3 bg-panel2 w-2/3" />
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
