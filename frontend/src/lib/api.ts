// API client — Corporate Underground frontend.
// Base: NEXT_PUBLIC_API_URL or relative /api (reverse-proxied to NestJS backend).
// Auth: HTTP-only cookies (set by backend), sent automatically with credentials: "include".

import { showToast } from "./toast";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  leak?: { leaked: boolean; confidence: number; reason?: string };
  constructor(
    public status: number,
    message: string,
    leak?: { leaked: boolean; confidence: number; reason?: string },
  ) {
    super(message);
    this.name = "ApiError";
    this.leak = leak;
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    credentials: "include",
  });
  if (res.status === 401) {
    handleSessionExpired();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let leak: { leaked: boolean; confidence: number; reason?: string } | undefined;
    try {
      const body = (await res.json()) as {
        message?: string;
        error?: { leaked?: boolean; confidence?: number; reason?: string };
      };
      if (body.message) message = body.message;
      const err = body.error;
      if (err && err.leaked) {
        leak = {
          leaked: true,
          confidence: Number(err.confidence) || 0,
          reason: err.reason,
        };
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, leak);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

let redirectingToLogin = false;

/**
 * 401 interceptor: show a toast and redirect to /login once.
 * Never causes a loop — skips auth endpoints during initial load.
 */
export function handleSessionExpired() {
  if (typeof window === "undefined") return;
  if (redirectingToLogin) return;

  const path = window.location.pathname;
  if (path.startsWith("/login") || path.startsWith("/register")) return;

  // Skip silent background /auth/me checks (initial load) — RequireAuth handles those.
  // Only hard-redirect when an API call the user actually triggered returns 401,
  // so just use the global flag to avoid redirect storms from parallel calls.
  redirectingToLogin = true;
  showToast("Session expired. Please sign in again.", "warning");
  const target = `/login?session_expired=1&next=${encodeURIComponent(
    path + window.location.search,
  )}`;
  window.location.assign(target);
}

// ---- Types ----
export type PostType =
  | "NORMAL"
  | "POLL"
  | "CONFESSION"
  | "HOT_TAKE"
  | "AMA"
  | "TIME_CAPSULE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Company {
  id: string;
  name: string;
  slug: string;
  allowedDomains: string[];
  logoUrl: string | null;
  members: number;
}

export interface Author {
  pseudonym: string;
  avatarSeed: string;
  reputation: number;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface MediaFile {
  id: string;
  objectKey: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

export interface Post {
  id: string;
  type: PostType;
  title: string | null;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: Author;
  pollOptions: PollOption[] | null;
  mediaFiles: MediaFile[] | null;
  metadata: Record<string, unknown> | null;
  userLiked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  parentId: string | null;
  replies: Comment[];
}

export interface Pulse {
  temperature: number | null;
  moods: Record<string, number>;
  activeUsers: number;
  totalMembers: number;
  trendingTopics: { name: string; postCount: number }[];
  checkInCount: number;
  threshold: number;
}

export interface UserMe {
  id: string;
  photoUrl?: string | null;
  emergencyUrl?: string | null;
  memberships: { company: Company; status: string }[];
}

export interface LeakResult {
  leaked: boolean;
  confidence: number;
  reason?: string;
}

// ---- Normalizers (defensive against raw API shapes) ----
export function normCompany(raw: unknown): Company {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: (r.id as string) ?? "",
    name: (r.name as string) ?? (r.slug as string) ?? "UNKNOWN",
    slug: (r.slug as string) ?? "",
    allowedDomains: Array.isArray(r.allowedDomains)
      ? (r.allowedDomains as string[])
      : [],
    logoUrl: (r.logoUrl as string) ?? null,
    members:
      (r.members as number) ??
      (r.memberCount as number) ??
      (r.verified_members as number) ??
      ((r._count as Record<string, unknown>)?.memberships as number) ??
      0,
  };
}

export function normAuthor(raw: unknown): Author {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    pseudonym: (r.pseudonym as string) ?? "ANON",
    avatarSeed: (r.avatarSeed as string) ?? (r.id as string) ?? "anon",
    reputation: (r.reputation as number) ?? 0,
  };
}

export function normPost(raw: unknown): Post {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: (r.id as string) ?? "",
    type: (r.type as PostType) ?? "NORMAL",
    title: (r.title as string) ?? null,
    content: (r.content as string) ?? "",
    likeCount: (r.likeCount as number) ?? 0,
    commentCount: (r.commentCount as number) ?? 0,
    createdAt: (r.createdAt as string) ?? new Date().toISOString(),
    author: normAuthor(r.author),
    pollOptions: Array.isArray(r.pollOptions)
      ? (r.pollOptions as Record<string, unknown>[]).map((o) => ({
          id: (o.id as string) ?? "",
          text: (o.text as string) ?? "",
          voteCount: (o.voteCount as number) ?? 0,
        }))
      : null,
    mediaFiles: Array.isArray(r.mediaFiles)
      ? (r.mediaFiles as Record<string, unknown>[]).map((m) => ({
          id: (m.id as string) ?? "",
          objectKey: (m.objectKey as string) ?? "",
          mimeType: (m.mimeType as string) ?? "",
          width: (m.width as number) ?? null,
          height: (m.height as number) ?? null,
        }))
      : null,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    userLiked: (r.userLiked as boolean) ?? false,
  };
}

export function normComment(raw: unknown): Comment {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: (r.id as string) ?? "",
    content: (r.content as string) ?? "",
    createdAt: (r.createdAt as string) ?? new Date().toISOString(),
    author: normAuthor(r.author),
    parentId: (r.parentId as string) ?? null,
    replies: Array.isArray(r.replies) ? r.replies.map(normComment) : [],
  };
}

export function normUser(raw: unknown): UserMe {
  const r = (raw ?? {}) as Record<string, unknown>;
  const ms = Array.isArray(r.memberships)
    ? (r.memberships as Record<string, unknown>[]).map((m) => ({
        company:
          typeof m.company === "string"
            ? normCompany({ slug: m.company, name: m.company })
            : normCompany(m.company),
        status: (m.status as string) ?? "PENDING",
      }))
    : [];
  return {
    id: (r.id as string) ?? "",
    photoUrl: (r.photoUrl as string) ?? null,
    emergencyUrl: (r.emergencyUrl as string) ?? null,
    memberships: ms,
  };
}

export function normPulse(raw: unknown): Pulse {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    temperature: (r.temperature as number) ?? (r.temp as number) ?? null,
    moods: (r.moods as Record<string, number>) ?? (r.moodDistribution as Record<string, number>) ?? {},
    activeUsers: (r.activeMembers as number) ?? (r.activeUsers as number) ?? (r.active as number) ?? 0,
    totalMembers: (r.verifiedCount as number) ?? (r.totalMembers as number) ?? (r.members as number) ?? 0,
    trendingTopics: Array.isArray(r.trendingTopics)
      ? (r.trendingTopics as Record<string, unknown>[]).map((t) => ({
          name: (t.name as string) ?? (t.topic as string) ?? "",
          postCount: (t.postCount as number) ?? (t.count as number) ?? 0,
        }))
      : [],
    checkInCount: (r.checkInCount as number) ?? (r.totalCheckIns as number) ?? 0,
    threshold: (r.threshold as number) ?? 5,
  };
}

export function normList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  if (r && Array.isArray(r.posts)) return r.posts;
  if (r && Array.isArray(r.items)) return r.items;
  if (r && Array.isArray(r.companies)) return r.companies;
  return [];
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

export function normFeed(raw: unknown): FeedResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const posts = normList(r.posts ?? r.items ?? []).map(normPost) as Post[];
  const nextCursor =
    typeof r.nextCursor === "string" && r.nextCursor.length > 0
      ? r.nextCursor
      : null;
  return { posts, nextCursor };
}

// Flatten any nesting then rebuild tree from parentId links.
// Normalize comment tree from backend (already built as tree structure)
export function buildCommentTree(rawList: unknown[]): Comment[] {
  return rawList.map(normComment);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    .toUpperCase();
}

// ---- API calls ----
export const authApi = {
  login: (email: string, password: string) =>
    api<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    api<Record<string, unknown>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    api<void>("/auth/logout", { method: "POST" }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
  requestReset: (email: string) =>
    api<void>("/auth/request-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  validateResetToken: (token: string) =>
    api<void>("/auth/validate-reset-token", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    api<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
};

export const companiesApi = {
  list: (q?: string) =>
    api<unknown>(`/companies${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(
      (r) => normList(r).map(normCompany),
    ),
  bySlug: (slug: string) =>
    api<unknown>(`/companies/${encodeURIComponent(slug)}`).then(normCompany),
  pulse: (slug: string) =>
    api<unknown>(`/companies/${encodeURIComponent(slug)}/pulse`).then(normPulse),
  join: (slug: string) =>
    api<unknown>(`/companies/${encodeURIComponent(slug)}/join`, { method: "POST" }),
};

export type CommunityEvent =
  | { type: "NEW_POST"; companySlug: string; post: Post }
  | { type: "POST_LIKED"; companySlug: string; postId: string; likeCount: number }
  | { type: "POST_COMMENTED"; companySlug: string; postId: string; commentCount: number; comment: unknown }
  | { type: "STATS_UPDATED"; companySlug: string; verifiedCount: number };

export const communityApi = {
  feed: (slug: string, type?: string, sort?: string, cursor?: string) => {
    const params = new URLSearchParams();
    if (type && type !== "ALL") params.set("type", type);
    if (sort && sort !== "latest") params.set("sort", sort);
    if (cursor) params.set("cursor", cursor);
    const query = params.toString();
    return api<unknown>(
      `/community/${encodeURIComponent(slug)}/feed${query ? `?${query}` : ""}`,
    ).then(normFeed);
  },
  createPost: (
    slug: string,
    body: {
      type: PostType;
      title?: string;
      content: string;
      pollOptions?: string[];
      mediaIds?: string[];
      leakCheckConsent: boolean;
      metadata?: Record<string, unknown>;
    },
  ) =>
    api<unknown>(`/community/${encodeURIComponent(slug)}/posts`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then(normPost),
  post: (slug: string, id: string) =>
    api<Record<string, unknown>>(
      `/community/${encodeURIComponent(slug)}/posts/${encodeURIComponent(id)}`,
    ),
  comment: (slug: string, id: string, content: string, parentId?: string) =>
    api<unknown>(
      `/community/${encodeURIComponent(slug)}/posts/${encodeURIComponent(
        id,
      )}/comments`,
      { method: "POST", body: JSON.stringify({ content, parentId }) },
    ).then(normComment),
  react: (slug: string, id: string, type = "LIKE") =>
    api<unknown>(
      `/community/${encodeURIComponent(slug)}/posts/${encodeURIComponent(
        id,
      )}/react`,
      { method: "POST", body: JSON.stringify({ type }) },
    ),
  vote: (slug: string, id: string, optionId: string) =>
    api<unknown>(
      `/community/${encodeURIComponent(slug)}/posts/${encodeURIComponent(
        id,
      )}/vote`,
      { method: "POST", body: JSON.stringify({ optionId }) },
    ),
  // ponytail: check-in endpoint assumed under community; align with backend when it lands.
  checkin: (slug: string, mood: string) =>
    api<unknown>(`/community/${encodeURIComponent(slug)}/temperature`, {
      method: "POST",
      body: JSON.stringify({ mood }),
    }),
};

export const verificationApi = {
  requestEmail: (companySlug: string, workEmail: string) =>
    api<{ requestId: string }>("/verification/request-email", {
      method: "POST",
      body: JSON.stringify({ companySlug, workEmail, email: workEmail }),
    }),
  verifyOtp: (requestId: string, otp: string) =>
    api<Record<string, unknown>>("/verification/verify-otp", {
      method: "POST",
      body: JSON.stringify({ requestId, otp, code: otp }),
    }),
  claimCode: (secretCode: string, companySlug?: string) =>
    api<Record<string, unknown>>("/verification/claim-code", {
      method: "POST",
      body: JSON.stringify({ companySlug, secretCode, code: secretCode }),
    }),
};

export const privacyApi = {
  checkLeak: (content: string) =>
    api<LeakResult>("/privacy/check-leak", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

export const profileApi = {
  getSelf: () => api<Record<string, unknown>>("/profile"),
  updateEmergencyUrl: (emergencyUrl: string | null) =>
    api<{ id: string; emergencyUrl: string | null }>("/profile/emergency-url", {
      method: "PATCH",
      body: JSON.stringify({ emergencyUrl }),
    }),
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return fetch(`${API_BASE}/profile/photo`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let msg = "Upload failed";
        try {
          const json = await res.json() as { message?: string };
          if (json.message) msg = json.message;
        } catch {
          /* non-JSON error body */
        }
        throw new ApiError(res.status, msg);
      }
      return (await res.json()) as { photoUrl: string };
    });
  },
};
