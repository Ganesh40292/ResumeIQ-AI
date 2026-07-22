import api from './api';

const interviewPrepService = {
  startSession: async (payload) => {
    const response = await api.post('/interview/session', payload);
    return response.data;
  },

  evaluateSession: async (payload) => {
    const response = await api.post('/interview/evaluate', payload);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/interview/history');
    return response.data;
  },

  getReport: async (sessionId) => {
    const response = await api.get(`/interview/report/${sessionId}`);
    return response.data;
  }
};

export default interviewPrepService;
