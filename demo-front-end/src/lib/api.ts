import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request để tự động gắn token
api.interceptors.request.use(
  (config) => {
    // Kiểm tra xem có đang chạy trên client hay không
    if (typeof window !== 'undefined') {
      // Lấy token từ LocalStorage
      const token = localStorage.getItem('token'); 

      if (token) {
        try {
          // Decode payload kiểm tra hạn sử dụng (exp)
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            sessionStorage.setItem('sessionExpired', 'true');
            window.location.href = '/login';
            return Promise.reject(new Error("Token expired"));
          }
        } catch (e) {
          // Ignore parse errors, just attach token
        }
        
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response để xử lý lỗi như 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token hết hạn hoặc không hợp lệ -> chuyển hướng sang trang login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token'); // Xoá token cũ
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        sessionStorage.setItem('sessionExpired', 'true');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
