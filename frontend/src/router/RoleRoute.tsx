import { Navigate, Outlet } from "react-router";
import { type FC } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getHomePath } from "@/router/roleNavigation";

interface RoleRouteProps {
    role: string;
};

const RoleRoute: FC<RoleRouteProps> = ({ role }) => {
    const { loading, userRole } = useAuth();
    if (loading) {
        return <div>Loading...</div>
    }

    if (!userRole) {
        return <Navigate to="/login" replace />
    }

    if (userRole !== role) {
        return <Navigate to={getHomePath(userRole)} replace />;
    }

    return <Outlet />;
}

export default RoleRoute;