import { Navigate, Outlet } from "react-router";
import { type FC } from "react";

interface RoleRouteProps {
    role: string;
};

const RoleRoute: FC<RoleRouteProps> = ({ role }) => {
    const userRole = role;

    if (userRole !== role) {
        return <Navigate to="/login" />;
    }

    return <Outlet />;
}

export default RoleRoute;