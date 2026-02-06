import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token && !config.skipAuth) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.error || 'Request failed';
        return Promise.reject(new Error(message));
    }
);

// Auth API
export const authAPI = {
    register: (username, email, password, role = 'student') =>
        api.post('/auth/register', { username, email, password, role }, { skipAuth: true }),

    login: async (username, password) => {
        const data = await api.post('/auth/login', { username, password }, { skipAuth: true });
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
    },

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => !!localStorage.getItem('authToken'),
};

// Problems API
export const problemsAPI = {
    getAll: () => api.get('/problems', { skipAuth: true }),

    getById: (id) => api.get(`/problems/${id}`, { skipAuth: true }),

    create: (data) => api.post('/problems', data),

    update: (id, data) => api.put(`/problems/${id}`, data),

    delete: (id) => api.delete(`/problems/${id}`),

    getTestCases: (problemId) => api.get(`/problems/${problemId}/testcases`),

    createTestCase: (problemId, data) => api.post(`/problems/${problemId}/testcases`, data),

    deleteTestCase: (problemId, testCaseId) =>
        api.delete(`/problems/${problemId}/testcases/${testCaseId}`),
};

// Submissions API
export const submissionsAPI = {
    submit: (problemId, languageId, sourceCode) =>
        api.post('/submit', { problem_id: problemId, language_id: languageId, source_code: sourceCode }),

    run: (problemId, languageId, sourceCode) =>
        api.post('/run', { problem_id: problemId, language_id: languageId, source_code: sourceCode }, { skipAuth: true }),

    getForProblem: (problemId) => api.get(`/problems/${problemId}/submissions`),

    getCompleted: () => api.get('/my/completed-problems'),
};

// Plagiarism API
export const plagiarismAPI = {
    checkProblem: (problemId, languageId = null) => {
        let url = `/plagiarism/problems/${problemId}`;
        if (languageId) url += `?language_id=${languageId}`;
        return api.get(url);
    },

    checkSubmission: (submissionId) => api.get(`/plagiarism/submissions/${submissionId}`),

    getResults: (problemId) => api.get(`/plagiarism/results/${problemId}`),
};

// Dashboard API
export const dashboardAPI = {
    getData: () => api.get('/dashboard'),
};

export default api;
