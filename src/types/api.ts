// ============================================================
// src/types/api.ts
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, string[]> | null;
  timestamp: string;
}

export interface PaginatedParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}