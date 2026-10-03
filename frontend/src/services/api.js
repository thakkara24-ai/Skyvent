import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skyvent_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: unwrap responses & handle token refresh
api.interceptors.response.use(
  (response) => {
    // If backend returns { success: true, data: ... }, extract data or response directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('skyvent_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken });
          const newAccess = res.data.access;
          localStorage.setItem('skyvent_access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('skyvent_access_token');
          localStorage.removeItem('skyvent_refresh_token');
          localStorage.removeItem('skyvent_user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

    // Format friendly error message
    const errorMsg = error.response?.data?.message || 
                     error.response?.data?.detail || 
                     error.message || 
                     'A network or server error occurred.';
                     
    return Promise.reject({
      message: errorMsg,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      errors: error.response?.data?.errors,
      status: error.response?.status
    });
  }
);

// ==========================================
// DOMAIN SERVICES
// ==========================================

export const authService = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  sendOtp: (email, purpose = 'REGISTER') => api.post('/auth/send-otp/', { email, purpose }),
  verifyOtp: (email, otp, purpose = 'REGISTER') => api.post('/auth/verify-otp/', { email, otp, purpose }),
  logout: () => api.post('/auth/logout/'),
  getMe: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  resetPassword: (payload) => api.post('/auth/reset-password/', payload),
  getUsers: (params) => api.get('/users/', { params }),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
};

export const membershipService = {
  getPlans: () => api.get('/membership-plans/'),
  createPlan: (data) => api.post('/membership-plans/', data),
  updatePlan: (id, data) => api.patch(`/membership-plans/${id}/`, data),
  getMemberships: (params) => api.get('/memberships/', { params }),
  purchaseMembership: (planId, paymentMethod = 'Demo Payment') => 
    api.post('/memberships/', { plan_id: planId, payment_method: paymentMethod }),
};

export const eventService = {
  getEvents: (params) => api.get('/events/', { params }),
  getEvent: (id) => api.get(`/events/${id}/`),
  createEvent: (data) => api.post('/events/', data),
  updateEvent: (id, data) => api.patch(`/events/${id}/`, data),
  deleteEvent: (id) => api.delete(`/events/${id}/`),
};

export const ticketService = {
  getTickets: (params) => api.get('/tickets/', { params }),
  purchaseTicket: (eventId, paymentMethod = 'Demo Payment') => 
    api.post(`/events/${eventId}/tickets/`, { payment_method: paymentMethod }),
  cancelTicket: (id) => api.post(`/tickets/${id}/cancel/`),
};

export const attendanceService = {
  checkIn: (payload) => api.post('/attendance/check-in/', payload),
  getEventAttendance: (eventId, params) => api.get(`/events/${eventId}/attendance/`, { params }),
};

export const productService = {
  getProducts: (params) => api.get('/products/', { params }),
  getProduct: (id) => api.get(`/products/${id}/`),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.patch(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
};

export const orderService = {
  getOrders: (params) => api.get('/orders/', { params }),
  getOrder: (id) => api.get(`/orders/${id}/`),
  createOrder: (orderData) => api.post('/orders/', orderData),
};

export const announcementService = {
  getAnnouncements: (params) => api.get('/announcements/', { params }),
  createAnnouncement: (data) => api.post('/announcements/', data),
  updateAnnouncement: (id, data) => api.patch(`/announcements/${id}/`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}/`),
};

export const fundraiserService = {
  getFundraisers: (params) => api.get('/fundraisers/', { params }),
  createFundraiser: (data) => api.post('/fundraisers/', data),
  updateFundraiser: (id, data) => api.patch(`/fundraisers/${id}/`, data),
  getFundraiserTasks: (fundraiserId) => api.get(`/fundraisers/${fundraiserId}/tasks/`),
  createFundraiserTask: (fundraiserId, taskData) => api.post(`/fundraisers/${fundraiserId}/tasks/`, taskData),
  getAllTasks: (params) => api.get('/tasks/', { params }),
  updateTask: (taskId, data) => api.patch(`/tasks/${taskId}/`, data),
};

export const financeService = {
  getSummary: (params) => api.get('/finance/summary/', { params }),
  getTransactions: (params) => api.get('/transactions/', { params }),
  createTransaction: (data) => api.post('/transactions/', data),
  getExpenses: (params) => api.get('/expenses/', { params }),
  createExpense: (data) => api.post('/expenses/', data),
  reviewExpense: (id, reviewData) => api.post(`/expenses/${id}/review/`, reviewData),
};

export const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard/admin/'),
  getMemberDashboard: () => api.get('/dashboard/member/'),
  getReports: (params) => api.get('/reports/', { params }),
  getAuditLogs: (params) => api.get('/audit-logs/', { params }),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications/'),
  markAsRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

export default api;
