import axios from "axios";
import { getToken } from '../lib/auth'

function clearAuthStorage() {
  try {
    localStorage.removeItem('bachelore_auth');
    localStorage.removeItem('bachelore_user');
    localStorage.removeItem('bachelore_token');
    localStorage.removeItem('bachelore_admin_auth');
  } catch (e) {
    // noop
  }
}

const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";
const instance = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 12000),
});
instance.interceptors.request.use(
  (req) => {
    try {
      const token = getToken();
      if (token) {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${token}`;
      }
      console.debug(
        "[axios] Request:",
        req.method,
        req.url,
        req.data ? req.data : ""
      );
    } catch (e) {}
    return req;
  },
  (err) => {
    console.debug("[axios] Request error", err);
    return Promise.reject(err);
  }
);

instance.interceptors.response.use(
  (res) => {
    try {
      console.debug("[axios] Response:", res.status, res.config.url, res.data);
    } catch (e) {}
    return res;
  },
  (err) => {
    try {
      console.debug(
        "[axios] Response error:",
        err.response?.status,
        err.response?.data
      );

      const isAuthError = err.response?.status === 401;
      const authMsg = String(err.response?.data?.msg || '').toLowerCase();
      if (isAuthError && authMsg.includes('authentication required')) {
        clearAuthStorage();
        const currentPath = window.location.pathname || '/';
        if (currentPath.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    } catch (e) {}
    return Promise.reject(err);
  }
);

export default instance;
