import api from './api';

const resumeBuilderService = {
  getTemplates: async () => {
    const response = await api.get('/resume-builder/templates');
    return response.data;
  },

  getResumeState: async (resumeId) => {
    const response = await api.get(`/resume-builder/${resumeId}`);
    return response.data;
  },

  saveResumeState: async (payload) => {
    const response = await api.post('/resume-builder/save', payload);
    return response.data;
  },

  createVersion: async (payload) => {
    const response = await api.post('/resume-builder/version', payload);
    return response.data;
  },

  getVersionHistory: async (resumeId) => {
    const response = await api.get(`/resume-builder/version-history?resumeId=${resumeId}`);
    return response.data;
  },

  exportDocx: async (payload) => {
    const response = await api.post('/resume-builder/export/docx', payload, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportPdf: async (payload) => {
    const response = await api.post('/resume-builder/export/pdf', payload, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default resumeBuilderService;
// 
