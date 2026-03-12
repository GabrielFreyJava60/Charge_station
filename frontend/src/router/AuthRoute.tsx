import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import { LOGIN_PATH } from "./roleNavigation";


const AuthRoute: React.FC = () => {
    const { loading, user } = useAuth();
    if (loading) {
        return <div>Loading...</div>
    }
    if (!user) {
        return <Navigate to={LOGIN_PATH} replace />
    }

    return <Outlet />;
}

export default AuthRoute;