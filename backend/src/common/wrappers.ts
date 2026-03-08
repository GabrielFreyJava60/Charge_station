import { apiResponse, apiResponseList } from "./wrapperTypes";

export function wrapResponse<T>(data: T): apiResponse<T> {
    return { data };
}

export function wrapResponseList<T>(
    data: T[],
    totalItems: number,
    pageSize: number,
    page: number = 1,
    totalPages: number = 1,
): apiResponseList<T> {
    return {
        data,
        meta: {
            page,
            totalPages,
            pageSize,
            totalItems,
        }
    }
}