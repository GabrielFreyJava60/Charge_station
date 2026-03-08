import { Navigate, Outlet } from "react-router";

const isAuthenticated = true;

const ProtectedRoute = () => {
    if (!isAuthenticated) {
        return <Navigate to='/login' replace />
    }

    return <Outlet />;
}

export default ProtectedRoute;