import { createBrowserRouter } from 'react-router';
import LoginPage from '@/pages/guest/LoginPage';
import RegisterPage from '@/pages/guest/RegisterPage';
import GuestDashboardPage from '@/pages/guest/GuestDashboardPage';

const router = createBrowserRouter([
    /* Guest (unprotected) pages */
    {
        path: '/login',
        Component: LoginPage
    },
    {
        path: '/register',
        Component: RegisterPage
    },
    {
        path: '/',
        Component: GuestDashboardPage,
    }
]);

export default router;