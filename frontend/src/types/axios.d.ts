import "axios";

declare module 'axios' {
    interface AxiosRequestConfig {
        _isRetry?: boolean;
    }
    interface InternalAxiosRequestConfig {
        _isRetry?: boolean;
    }
}