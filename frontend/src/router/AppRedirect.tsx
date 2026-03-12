import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";
import { getHomePath, LOGIN_PATH } from "./roleNavigation";

const AppRedirect: React.FC = () => {
    const { userRole } = useAuth();
    
    if (!userRole) {
        return <Navigate to={LOGIN_PATH} />;
    }

    return <Navigate to={getHomePath(userRole)} />;
}

export default AppRedirect;