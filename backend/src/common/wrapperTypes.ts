export interface apiMetadata{
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface apiResponse<T> {
    data: T
};

export interface apiResponseList<T> {
    data: T[];
    meta: apiMetadata;
}