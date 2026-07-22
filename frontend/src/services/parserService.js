import api from './api';

const parserService = {
  parseResume: async (resumeId) => {
    const response = await api.post(`/parser/${resumeId}`);
    return response.data;
  },

  getParsedResume: async (resumeId) => {
    const response = await api.get(`/parser/${resumeId}`);
    return response.data;
  }
};

export default parserService;
