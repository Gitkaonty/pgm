import axios from "../../config/axios";
import useAuth from "./useAuth";

const useLogout = () => {
    const { setAuth } = useAuth();

    const logout = async () => {
        setAuth({});

        try {
            await axios('/api/logout', {
                withCredentials: true
            });
            sessionStorage.clear();
        }
        catch (err) {
            console.error(err);
        }
    }
    return logout;
}

export default useLogout;