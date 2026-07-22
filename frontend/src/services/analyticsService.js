import api from './api';

const analyticsService = {
  getDashboardSummary: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getCareerProgress: async () => {
    const response = await api.get('/analytics/career-progress');
    return response.data;
  },

  getGoals: async () => {
    const response = await api.get('/analytics/goals');
    return response.data;
  },

  createGoal: async (payload) => {
    const response = await api.post('/analytics/goals', payload);
    return response.data;
  },

  updateGoal: async (id, payload) => {
    const response = await api.put(`/analytics/goals/${id}`, payload);
    return response.data;
  },

  deleteGoal: async (id) => {
    const response = await api.delete(`/analytics/goals/${id}`);
    return response.data;
  }
};

export default analyticsService;
