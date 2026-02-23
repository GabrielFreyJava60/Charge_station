import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '@/api/client';
import { User } from '@/types';

interface AdminState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await adminAPI.listUsers();
      return data.users;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки пользователей');
    }
  },
);

const initialState: AdminState = {
  users: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export default adminSlice.reducer;
