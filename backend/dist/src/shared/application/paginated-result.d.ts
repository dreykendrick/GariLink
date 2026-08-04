export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class PaginatedResult<T> {
    readonly data: T[];
    readonly meta: PaginationMeta;
    constructor(data: T[], page: number, limit: number, total: number);
    static of<T>(data: T[], page: number, limit: number, total: number): PaginatedResult<T>;
}
export declare class CursorPaginatedResult<T> {
    readonly data: T[];
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
    constructor(data: T[], nextCursor: string | null);
    static of<T>(data: T[], nextCursor: string | null): CursorPaginatedResult<T>;
}
