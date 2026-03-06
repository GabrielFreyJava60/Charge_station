export class ApiClientError extends Error {
    name: string;
    code: string;
    status?: number;

    constructor(message: string, code: string, status?: number) {
        super(message);
        this.name = "ApiClientError";
        this.code = code;
        this.status = status;
    }
};