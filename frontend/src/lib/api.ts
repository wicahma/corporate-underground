// API client — Corporate Underground frontend.
// Base: NEXT_PUBLIC_API_URL or relative /api (reverse-proxied to NestJS backend).

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const TOKEN_KEY = "cu_token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string | null) {
    if (typeof window === "undefined") return;
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 401) tokenStore.set(null);
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
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
  metadata: Record<string, unknown> | null;
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
  email: string;
  memberships: { company: Company; status: string }[];
}

export interface LeakResult {
  score: number;
  risk: RiskLevel;
  flags: { keyword: string; severity: number }[];
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
      (r.verifiedMembers as number) ??
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
    metadata: (r.metadata as Record<string, unknown>) ?? null,
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
    email: (r.email as string) ?? "",
    memberships: ms,
  };
}

export function normPulse(raw: unknown): Pulse {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    temperature: (r.temperature as number) ?? (r.temp as number) ?? null,
    moods: (r.moods as Record<string, number>) ?? (r.moodDistribution as Record<string, number>) ?? {},
    activeUsers: (r.activeUsers as number) ?? (r.active as number) ?? 0,
    totalMembers: (r.totalMembers as number) ?? (r.members as number) ?? 0,
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

// Flatten any nesting then rebuild tree from parentId links.
export function buildCommentTree(rawList: unknown[]): Comment[] {
  const flat = rawList.map(normComment);
  if (flat.some((c) => c.replies.length > 0)) {
    const flatten = (list: Comment[]): Comment[] =>
      list.flatMap((c) => [c, ...flatten(c.replies)]);
    return buildCommentTree(flatten(flat));
  }
  const map = new Map<string, Comment>();
  for (const c of flat) map.set(c.id, { ...c, replies: [] });
  const roots: Comment[] = [];
  for (const c of map.values()) {
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.replies.push(c);
    else roots.push(c);
  }
  return roots;
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
};

export const communityApi = {
  feed: (slug: string, type?: string) =>
    api<unknown>(
      `/community/${encodeURIComponent(slug)}/feed${
        type && type !== "ALL" ? `?type=${encodeURIComponent(type)}` : ""
      }`,
    ).then((r) => normList(r).map(normPost)),
  createPost: (
    slug: string,
    body: {
      type: PostType;
      title?: string;
      content: string;
      options?: string[];
      leakCheckConsent: boolean;
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
    api<unknown>(`/community/${encodeURIComponent(slug)}/checkins`, {
      method: "POST",
      body: JSON.stringify({ mood }),
    }),
};

export const verificationApi = {
  requestEmail: (companySlug: string, email: string) =>
    api<Record<string, unknown>>("/verification/request-email", {
      method: "POST",
      body: JSON.stringify({ companySlug, email }),
    }),
  verifyOtp: (requestId: string, code: string) =>
    api<Record<string, unknown>>("/verification/verify-otp", {
      method: "POST",
      body: JSON.stringify({ requestId, code }),
    }),
  claimCode: (code: string) =>
    api<Record<string, unknown>>("/verification/claim-code", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};

export const privacyApi = {
  checkLeak: (content: string) =>
    api<LeakResult>("/privacy/check-leak", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};