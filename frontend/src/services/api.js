const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

/**
 * Custom fetch wrapper that handles JSON serialization and Bearer token attachment
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('seqa_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Authentication
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => request('/auth/me'),

  getDevelopers: () => request('/auth/developers'),

  getUsers: () => request('/auth/users'),

  // Defects
  getDefectStats: () => request('/defects/stats/summary'),

  getDefects: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.status && params.status !== 'ALL') searchParams.append('status', params.status);
    const queryString = searchParams.toString();
    return request(`/defects${queryString ? `?${queryString}` : ''}`);
  },

  getDefectById: (id) => request(`/defects/${id}`),

  createDefect: (defectData) =>
    request('/defects', {
      method: 'POST',
      body: JSON.stringify(defectData)
    }),

  // Developer Fix Submission
  submitFix: (defectId, fixData) =>
    request(`/defects/${defectId}/fix`, {
      method: 'POST',
      body: JSON.stringify(fixData)
    }),

  // QA Re-Test
  getRetestQueue: () => request('/retests/queue'),

  submitRetest: (defectId, retestData) =>
    request(`/defects/${defectId}/retest`, {
      method: 'POST',
      body: JSON.stringify(retestData)
    }),

  // QA Lead Closure
  getPendingClosures: () => request('/closures/pending'),

  approveClosure: (defectId) =>
    request(`/defects/${defectId}/approve-closure`, {
      method: 'POST'
    })
};

export default api;
