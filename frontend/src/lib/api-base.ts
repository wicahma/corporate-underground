// API Client for Corporate Underground
// Uses relative /api which Next.js rewrites to NestJS on port 8083

export const API_BASE = "";

export interface ApiError {
  message: string | string[];
  error?: string;
  statusCode?: number;
}
