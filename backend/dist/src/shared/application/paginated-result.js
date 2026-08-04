"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorPaginatedResult = exports.PaginatedResult = void 0;
class PaginatedResult {
    constructor(data, page, limit, total) {
        this.data = data;
        this.meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    static of(data, page, limit, total) {
        return new PaginatedResult(data, page, limit, total);
    }
}
exports.PaginatedResult = PaginatedResult;
class CursorPaginatedResult {
    constructor(data, nextCursor) {
        this.data = data;
        this.nextCursor = nextCursor;
        this.hasMore = nextCursor !== null;
    }
    static of(data, nextCursor) {
        return new CursorPaginatedResult(data, nextCursor);
    }
}
exports.CursorPaginatedResult = CursorPaginatedResult;
//# sourceMappingURL=paginated-result.js.map