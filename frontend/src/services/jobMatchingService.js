import api from './api';

const jobMatchingService = {
  analyzeMatch: async (payload) => {
    const response = await api.post('/job-matcher/analyze', payload);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/job-matcher/history');
    return response.data;
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/job-matcher/report/${id}`);
    return response.data;
  },

  getJobDescriptions: async () => {
    const response = await api.get('/job-descriptions');
    return response.data;
  },

  createJobDescription: async (payload) => {
    const response = await api.post('/job-descriptions', payload);
    return response.data;
  },

  updateJobDescription: async (id, payload) => {
    const response = await api.put(`/job-descriptions/${id}`, payload);
    return response.data;
  },

  deleteJobDescription: async (id) => {
    const response = await api.delete(`/job-descriptions/${id}`);
    return response.data;
  }
};

export default jobMatchingService;
