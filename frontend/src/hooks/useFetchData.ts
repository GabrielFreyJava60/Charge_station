import { useEffect, useState } from "react";
import { apiClient } from '@/services/api'

export function useFetchData<T>(
    endpoint: string,
    params?: Record<string, string | boolean | number>
) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null)

    useEffect(
        () => {
            const fetchData = async () => {
                setIsLoading(true);
                setIsError(false);
                setError(null);
                try {
                    const fetchResult = await apiClient.get<T>(endpoint, params);
                    setData(fetchResult);
                }
                catch (e) {
                    setIsError(true);
                    setError(e instanceof Error ? e.message : 'Unknown error');
                }
                finally {
                    setIsLoading(false);
                }
            };
            fetchData();
    }, [endpoint, JSON.stringify(params)]);

    return { isLoading, isError, error, data };
}