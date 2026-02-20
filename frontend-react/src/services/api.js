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
    getSectionAnalytics: (sectionId) => api.get(`/sections/${sectionId}/analytics`),
    createCourse: (data) => api.post('/courses', data),
    createLabSession: (data) => api.post('/lab-sessions', data),
    getContests: () => api.get('/contests'),
    createContest: (data) => api.post('/contests', data),
    getCourses: () => api.get('/courses'),
    getLabSessions: () => api.get('/lab-sessions'),
    getHodBranchData: () => api.get('/hod/branch-data'),
    assignFaculty: (data) => api.post('/hod/assign-faculty', data),
};

// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'), // Verify this endpoint on backend
    getCourses: () => api.get('/courses'),
    getUsers: (role) => api.get('/admin/users' + (role ? `?role=${role}` : '')),
    getCourseSessions: (courseId) => api.get(`/courses/${courseId}/sessions`),
    getSessionProblems: (courseId, sessionId) => api.get(`/courses/${courseId}/sessions/${sessionId}/problems`),
    getSessionLesson: (courseId, sessionId) => api.get(`/courses/${courseId}/sessions/${sessionId}/lessons`),
    createCourse: (data) => api.post('/courses', data),
    createSession: (courseId, data) => api.post(`/courses/${courseId}/sessions`, data),
    deleteSession: (courseId, sessionId) => api.delete(`/courses/${courseId}/sessions/${sessionId}`),
    addProblemToSession: (courseId, sessionId, data) => api.post(`/courses/${courseId}/sessions/${sessionId}/problems`, data),
    removeProblemFromSession: (courseId, sessionId, problemId) => api.delete(`/courses/${courseId}/sessions/${sessionId}/problems/${problemId}`),
    updateSessionLesson: (courseId, sessionId, data) => api.put(`/courses/${courseId}/sessions/${sessionId}/lessons`, data),
    createUser: (data) => api.post('/admin/users', data),
    toggleUser: (userId) => api.post(`/admin/users/${userId}/toggle-active`),
    importUsers: (role, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/admin/users/bulk?role=${role}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    downloadTemplate: (role) => {
        return api.get(`/admin/users/template?role=${role}`, { responseType: 'blob' });
    },
    getAllProblems: () => api.get('/admin/problems'),
};

// Principal API
export const principalAPI = {
    getDashboard: () => api.get('/principal/dashboard'),
    getBranches: () => api.get('/principal/branches'),
    assignHod: (data) => api.post('/principal/assign-hod', data),
};





export default api;
