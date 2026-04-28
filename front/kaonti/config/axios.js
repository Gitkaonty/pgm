import axios from "axios";
const BASE_URL = 'http://localhost:5150';
//const BASE_URL = 'https://finance.inframad.com/api';

export default axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

// axiosPrivate.interceptors.request.use(config => {
//   const token = localStorage.getItem('accessToken');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

export const URL = BASE_URL;