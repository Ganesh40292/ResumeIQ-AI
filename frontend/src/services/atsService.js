import api from './api';

const atsService = {
  analyzeResume: async (resumeId) => {
    const response = await api.post(`/ats/analyze/${resumeId}`);
    return response.data;
  },

  getReport: async (resumeId) => {
    const response = await api.get(`/ats/report/${resumeId}`);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/ats/history');
    return response.data;
  }
};

export default atsService;
