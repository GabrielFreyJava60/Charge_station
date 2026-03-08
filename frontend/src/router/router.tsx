import { createBrowserRouter } from 'react-router';
import LoginPage from '@/pages/guest/LoginPage';
import RegisterPage from '@/pages/guest/RegisterPage';
import GuestDashboardPage from '@/pages/guest/GuestDashboardPage';
import ProtectedRoute from './ProtectedRoute';
import UserDashboardPage from '@/pages/user/UserDashboardPage';
import UserCurrentSessionPage from '@/pages/user/UserCurrentSessionPage';
import UserProfilePage from '@/pages/user/UserProfilePage';
import SupportDashboardPage from '@/pages/support/SupportDashboardPage';
import SupportLogsPage from '@/pages/support/SupportLogsPage';
import SupportStationsPage from '@/pages/support/SupportStationsPage';
import SupportSessionsPage from '@/pages/support/SupportSessionsPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminStationsPage from '@/pages/admin/AdminStationsPage';
import RoleRoute from './RoleRoute';

const router = createBrowserRouter([
    /* Unprotected GUEST pages */
    { path: '/', Component: GuestDashboardPage, },
    //{ path: '/welcome', Component: GuestDashboardPage, },
    { path: '/login', Component: LoginPage, },
    {path: '/register', Component: RegisterPage, },
    
    /* Protected USER pages */
    {
        path: "/user",
        element: <ProtectedRoute />,
        children: [
            { Component: UserDashboardPage, index: true, },
            { path: "session", Component: UserCurrentSessionPage, },
            {
                path: "account",
                children: [
                    { path: "profile", Component: UserProfilePage },
                ]
            },
        ]

    },
    /*SUPPORT pages*/
    {
        path: "/support",
        element: <RoleRoute role="support" />,
        children: [
            { index: true, Component: SupportDashboardPage },
            { path: "logs", Component: SupportLogsPage },
            { path: "stations", Component: SupportStationsPage },
            { path: "sessions", Component: SupportSessionsPage },
        ],
    },

    /*ADMIN pages*/
    {
        path: "/admin",
        element: <RoleRoute role="admin" />,
        children: [
            { index: true, Component: AdminDashboardPage },
            { path: "users", Component: AdminUsersPage },
            { path: "stations", Component: AdminStationsPage },
        ],
    },
]);

export default router;