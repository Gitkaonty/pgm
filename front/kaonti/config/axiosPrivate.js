import { useEffect } from "react";
import axios from "axios";
import useAuth from "../src/hooks/useAuth";

const BASE_URL = "http://localhost:5150";
//const BASE_URL = 'https://finance.inframad.com/api';

const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

const useAxiosPrivate = () => {
    const { auth } = useAuth();

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            (config) => {
                if (!config.headers["Authorization"]) {
                    config.headers["Authorization"] = `Bearer ${auth?.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept);
        };
    }, [auth?.accessToken]);

    return axiosPrivate;
};

export default useAxiosPrivate;
