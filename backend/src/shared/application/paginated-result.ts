export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class PaginatedResult<T> {
  readonly data: T[];
  readonly meta: PaginationMeta;

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data;
    this.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  static of<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResult<T> {
    return new PaginatedResult(data, page, limit, total);
  }
}

export class CursorPaginatedResult<T> {
  readonly data: T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;

  constructor(data: T[], nextCursor: string | null) {
    this.data = data;
    this.nextCursor = nextCursor;
    this.hasMore = nextCursor !== null;
  }

  static of<T>(data: T[], nextCursor: string | null): CursorPaginatedResult<T> {
    return new CursorPaginatedResult(data, nextCursor);
  }
}
