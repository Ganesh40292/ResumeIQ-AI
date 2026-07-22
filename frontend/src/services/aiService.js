import api from './api';

const aiService = {
  reviewResume: async (resumeId, additionalPreferences) => {
    const response = await api.post(`/ai/review/${resumeId}`, { additionalPreferences });
    return response.data;
  },

  reviewProjects: async (resumeId, additionalPreferences) => {
    const response = await api.post(`/ai/projects/${resumeId}`, { additionalPreferences });
    return response.data;
  },

  generateSummary: async (resumeId, additionalPreferences) => {
    const response = await api.post(`/ai/summary/${resumeId}`, { additionalPreferences });
    return response.data;
  },

  recommendSkills: async (resumeId, additionalPreferences) => {
    const response = await api.post(`/ai/skills/${resumeId}`, { additionalPreferences });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/ai/history');
    return response.data;
  }
};

export default aiService;
