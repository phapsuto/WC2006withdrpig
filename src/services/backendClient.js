import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

// Configure Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for sending/receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Refresh Token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to get a new access token using the HTTP-only refresh token cookie
        const res = await axios.post(`${BASE_URL}/users/refresh-token`, {}, { withCredentials: true });
        
        if (res.data.success) {
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed (expired or invalid), force user to logout
        console.error('Session expired. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const backendClient = {
  // --- USERS / AUTH ---
  async login(userData) {
    const res = await apiClient.post('/users/login', userData);
    return res.data;
  },

  async register(userData) {
    const res = await apiClient.post('/users/register', userData);
    return res.data;
  },

  async googleLogin(userData) {
    const res = await apiClient.post('/users/google-login', userData);
    return res.data;
  },

  async logout() {
    const res = await apiClient.post('/users/logout');
    return res.data;
  },

  async forgotPassword(email) {
    const res = await apiClient.post('/users/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, password) {
    const res = await apiClient.post(`/users/reset-password/${token}`, { password });
    return res.data;
  },

  async verifyEmail(token) {
    const res = await apiClient.get(`/users/verify-email/${token}`);
    return res.data;
  },

  async resendVerification(email) {
    const res = await apiClient.post('/users/resend-verification', { email });
    return res.data;
  },

  async updateProfile(data) {
    const res = await apiClient.put('/users/profile', data);
    return res.data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  async toggleSaveMatch(matchId) {
    const res = await apiClient.post('/users/saved-matches', { matchId });
    return res.data;
  },

  async getProfile(userId) {
    const res = await apiClient.get('/users/profile'); // Profile API infers ID from token now
    return res.data;
  },

  async updateFavorites(userId, teams) {
    const res = await apiClient.put('/users/favorites', { teams }); // Uses token
    return res.data;
  },

  async getAllUsers() {
    const res = await apiClient.get('/users');
    return res.data;
  },

  async addBalance(userId, amount) {
    const res = await apiClient.put(`/users/${userId}/add-balance`, { amount });
    return res.data;
  },

  // --- MATCHES ---
  async getMatches(leagueId = 732) {
    const res = await apiClient.get(`/matches?leagueId=${leagueId}`);
    return res.data;
  },

  async getMatchDetails(id) {
    const res = await apiClient.get(`/matches/${id}/details`);
    return res.data;
  },

  async getMatchAnalytics(id, homeName, awayName) {
    const res = await apiClient.get(`/matches/${id}/analytics`, {
      params: { homeName, awayName }
    });
    return res.data;
  },

  async getMatchOdds(id) {
    const res = await apiClient.get(`/matches/${id}/odds`);
    return res.data;
  },

  async getPlayerDetails(id) {
    const res = await apiClient.get(`/players/${id}`);
    return res.data;
  },

  async getGroupedMatches(dateStr = 'today') {
    const res = await apiClient.get(`/matches/grouped?date=${dateStr}`);
    return res.data;
  },

  async syncMatches() {
    const res = await apiClient.post('/matches/sync');
    return res.data;
  },

  async simulateFinishMatch(id, homeScore, awayScore) {
    const res = await apiClient.post(`/matches/${id}/simulate-finish`, { homeScore, awayScore });
    return res.data;
  },

  async globalSearch(query) {
    const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  async getStandings(leagueId = 732) {
    const res = await apiClient.get(`/standings?leagueId=${leagueId}`);
    return res.data;
  },

  async getTeamFixtures(teamId, leagueId = 732) {
    const res = await apiClient.get(`/teams/${teamId}/fixtures?leagueId=${leagueId}`);
    return res.data;
  },

  // --- BETS ---
  async placeBet(betData) {
    const res = await apiClient.post('/bets/place', betData);
    return res.data;
  },

  async getUserBets() {
    const res = await apiClient.get(`/bets/user`);
    return res.data;
  },

  // --- NEWS ---
  async getAllNews(page = 1, limit = 12) {
    const res = await apiClient.get(`/news?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getNewsBySlug(slug) {
    const res = await apiClient.get(`/news/${slug}`);
    return res.data;
  }
};
