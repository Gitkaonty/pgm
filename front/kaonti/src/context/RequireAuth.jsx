import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import {jwtDecode} from "jwt-decode";

const RequireAuth = ({ allowedRoles }) => {
    const { auth } = useAuth();
    const location = useLocation();

    if (!auth?.accessToken) return null; // attendre PersistLogin

    let decoded;
    try {
        decoded = jwtDecode(auth.accessToken);
    } catch {
        return <Navigate to="/" replace />;
    }

    const role = decoded?.UserInfo?.roles; // STRING

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/tab/unauthorized" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default RequireAuth;