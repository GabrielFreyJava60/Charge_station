import { Navigate, Outlet } from "react-router-dom";
import { type FC } from "react";
import { useAuth } from "@/hooks/useAuth";
import { APP_PATH } from "@/router/roleNavigation";
import type { UserRole } from "@/types";

interface RoleRouteProps {
    role: UserRole;
};

const RoleRoute: FC<RoleRouteProps> = ({ role }) => {
    const { userRole } = useAuth();

    if (userRole === role) {
        return <Outlet />;
    }

    return <Navigate to={APP_PATH} replace />;
}

export default RoleRoute;