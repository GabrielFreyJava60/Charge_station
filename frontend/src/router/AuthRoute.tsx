import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { LOGIN_PATH } from "./roleNavigation";


const AuthRoute: React.FC = () => {
    const { loading, isAuthenticated } = useAuth();
    if (loading) {
        return <div>Loading...</div>
    }
    if (!isAuthenticated) {
        return <Navigate to={LOGIN_PATH} replace />
    }

    return <Outlet />;
}

export default AuthRoute;