/**
 * ReadyPI API Client
 *
 * Centralized HTTP client for communicating with the Express backend.
 * Automatically attaches the JWT token from localStorage to every request.
 */
import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('readypi_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('readypi_token');
      localStorage.removeItem('readypi_user');
      // Don't redirect if already on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    plan_tier: string;
    credit_balance: number;
  };
  token: string;
}

export interface SignupResponse {
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    plan_tier: string;
    created_at: string;
  };
  token: string;
  welcome_credits: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: string;
  email_verified: boolean;
  created_at: string;
  credits: {
    balance: number;
    total_purchased: number;
    total_used: number;
  };
  api_key_count: number;
}

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  signup: (email: string, password: string, full_name?: string) =>
    api.post<SignupResponse>('/auth/signup', { email, password, full_name }),

  me: () =>
    api.get<UserProfile>('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),

  /**
   * Exchange a Supabase Auth access token for a ReadyPI backend JWT.
   * This bridges Supabase Auth with our Postgres-backed user system.
   */
  supabaseExchange: (supabaseAccessToken: string) =>
    api.post<LoginResponse>('/auth/supabase-exchange', { access_token: supabaseAccessToken }),
};

// ─── Chat endpoints ───────────────────────────────────────────────────────────
 
 export const chatAPI = {
   playground: (payload: { model: string; messages: any[]; temperature: number; max_tokens: number }) =>
     api.post('/v1/chat/playground', payload),
 };
 
 // ─── Credits endpoints ────────────────────────────────────────────────────────

export const creditsAPI = {
  balance: () => api.get('/credits/balance'),
  usage: (params?: { limit?: number; offset?: number }) => api.get('/credits/usage', { params }),
  stats: () => api.get('/credits/stats'),
  createPayment: (packageId: string, method: string) =>
    api.post('/payment/create', { package_id: packageId, payment_method: method }),
  verifyRazorpay: (payload: {
    transaction_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post('/payment/razorpay/verify', payload),
};

// ─── API Keys endpoints ──────────────────────────────────────────────────────

export const keysAPI = {
  list: () => api.get('/keys'),
  create: (name: string) => api.post('/keys', { name }),
  revoke: (keyId: string) => api.delete(`/keys/${keyId}`),
};

export default api;
