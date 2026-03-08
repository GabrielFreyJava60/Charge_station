import { createBrowserRouter } from 'react-router';
import App from '@/App';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

const router = createBrowserRouter([
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
        Component: App,
    }
]);

export default router;