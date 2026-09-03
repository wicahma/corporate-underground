import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Corporate Underground",
    template: "%s — Corporate Underground",
  },
  description: "Your workplace. Without your name attached.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-ink">
      <body className="min-h-screen bg-ink text-fg antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}