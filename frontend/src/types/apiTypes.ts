export interface ApiError {
    code: string;
    message: string;
}

export interface ApiMetadata {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}

export interface ApiSuccessResponse<T> {
    data: T,
    meta?: ApiMetadata;
}

export interface ApiErrorResponse {
    error: ApiError
}

