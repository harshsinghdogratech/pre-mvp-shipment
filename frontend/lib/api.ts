import axios from "axios";

function normalizeApiRoot(u: string): string {
  const t = u.trim().replace(/\/+$/, "");
  if (t.endsWith("/api")) return t;
  return `${t}/api`;
}

function serverSideBaseURL(): string {
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (pub) return normalizeApiRoot(pub);
  const proxy = process.env.BACKEND_PROXY_URL?.trim();
  if (proxy) return normalizeApiRoot(proxy);
  return "http://127.0.0.1:8000/api";
}

const isBrowser = typeof window !== "undefined";

export const api = axios.create({
  baseURL: isBrowser ? "/api" : serverSideBaseURL(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")?.trim();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const url = String(err.config?.url ?? "");
      if (url.includes("/auth/login")) {
        return Promise.reject(err);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
