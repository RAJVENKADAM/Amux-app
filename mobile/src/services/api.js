// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config/api';

// Base URL setup
const API_URL = Constants?.expoConfig?.extra?.apiUrl || API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json', // ✅ keep this
  },
});

// Add JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync('authToken');
    }
    return Promise.reject(error);
  }
);

// ================= Auth API =================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  checkUsername: (username) => api.post('/auth/check-username', { username }),
};

// ================= User API =================
export const userAPI = {
  getProfile: (identifier) => {
    if (!identifier) {
      throw new Error('User identifier required');
    }
    return api.get(`/users/${encodeURIComponent(identifier)}`);
  },
  updateProfile: (data) => api.put('/users/profile', data),
  getActivity: (userId, page = 1, limit = 20) =>
    api.get(`/users/${userId}/activity`, { params: { page, limit } }),
  saveCourse: (courseId) => api.post(`/users/me/save-course/${courseId}`),
  toggleSaveCourse: (courseId) => api.post(`/users/me/save-course/${courseId}`),
  getSavedCourses: (userId, page = 1, limit = 10) =>
    api.get(`/users/${userId}/saved-courses`, { params: { page, limit } }),
  togglePinCourse: (courseId) => api.post(`/users/me/pin-course/${courseId}`),
  getMyPinnedCourses: () => api.get('/users/me/pinned-courses'),

};



// ================= Feed API =================
export const feedAPI = {
  getFeed: (page = 1, limit = 20) =>
    api.get('/feed', { params: { page, limit } }),
  likePost: (postId) => api.post(`/feed/${postId}/like`),
  commentOnPost: (postId, message) =>
    api.post(`/feed/${postId}/comment`, { message }),
};

// ================= Follow API =================
export const followAPI = {
  follow: (userId) => api.post(`/follow/${userId}`),
  unfollow: (userId) => api.delete(`/follow/${userId}`),
};

// ================= Search API =================
export const searchAPI = {
  search: (query, type = 'all', page = 1, limit = 20) =>
    api.get('/search', { params: { q: query, type, page, limit } }),
};

// ================= Tutor API =================
export const tutorAPI = {
  searchTutors: (query, page = 1, limit = 20) => searchAPI.search(query, 'users', page, limit),
};

// ================= Course API ================= (moved after searchAPI)




// ================= Notification API =================
export const notificationAPI = {
  getNotifications: (page = 1, limit = 50, unreadOnly = false) =>
    api.get('/notifications', { params: { page, limit, unreadOnly } }),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
};

// ================= Project API =================
export const projectAPI = {
  addProject: (data) => api.post('/users/projects', data),
};

// ================= Course API =================
export const courseAPI = {
  createCourse: (data) => api.post('/users/courses', data),
  getMyCourses: (userId, page = 1, limit = 10) =>
    api.get(`/users/${userId}/courses`, { params: { page, limit } }),
  getPopularCourses: (page = 1, limit = 10) =>
    api.get('/users/courses/popular', { params: { page, limit } }),
  getAllCourses: () => api.get('/users/courses'),
  getFollowingCourses: () => api.get('/courses/following'),
  getTopPaidCourses: () => api.get('/courses/top-paid'),
  getTopTrustCourses: () => api.get('/courses/top-trust'),
  getTrendingCourses: () => api.get('/courses/trending'),
  trustCourse: (courseId) => api.post(`/users/courses/${courseId}/trust`),
  distrustCourse: (courseId) => api.post(`/users/courses/${courseId}/distrust`),
  getPaidCourses: (page = 1, limit = 20) =>
    api.get('/users/me/paid-courses', { params: { page, limit } }),
  updateCourse: (courseId, data) => api.put(`/users/courses/${courseId}`, data),
  deleteCourse: (courseId) => api.delete(`/users/courses/${courseId}`),
  searchCourses: (query, page = 1, limit = 20) => searchAPI.search(query, 'projects', page, limit),
};




// ================= Payment API =================
export const paymentAPI = {
  createOrder: (courseId) => api.post(`/payment/order/${courseId}`),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getMyPayments: () => api.get('/payment/my-payments'),
  getCoursePaymentCount: (courseId) => api.get(`/payment/course/${courseId}/count`),
};

// ================= 🔥 NEW UPLOAD HELPER =================
export const uploadRequest = (url, formData) =>
  api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // ✅ FIX
    },
  });

// ================= Upload API =================
import { uploadAPI } from './uploadAPI';
export { uploadAPI };

export default api;