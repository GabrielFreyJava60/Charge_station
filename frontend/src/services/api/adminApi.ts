import { apiClient } from './api';
import type { ApiArrayResponse } from '@/types/apiTypes';
import type { AdminUser } from '@/types/responseTypes';

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const response = await apiClient.get<ApiArrayResponse<AdminUser>>(
        '/admin/users',
        { params: { page: 1, pageSize: 200 } },
    );
    return response.data;
}
