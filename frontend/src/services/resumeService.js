import api from './api';

const resumeService = {
  getAllResumes: async () => {
    const response = await api.get('/resumes');
    return response.data;
  },

  getResumeById: async (id) => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  uploadResume: async (file, resumeTitle, onProgress, cancelToken) => {
    const formData = new FormData();
    formData.append('file', file);
    if (resumeTitle) {
      formData.append('resumeTitle', resumeTitle);
    }

    const response = await api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
      cancelToken: cancelToken,
    });
    return response.data;
  },

  updateResume: async (id, resumeTitle) => {
    const response = await api.put(`/resumes/${id}`, { resumeTitle });
    return response.data;
  },

  deleteResume: async (id) => {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },

  setDefault: async (id) => {
    const response = await api.patch(`/resumes/${id}/default`);
    return response.data;
  },

  restoreResume: async (id) => {
    const response = await api.patch(`/resumes/${id}/restore`);
    return response.data;
  },

  downloadResume: async (id) => {
    const response = await api.get(`/resumes/download/${id}`, {
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'];
    let filename = 'resume.pdf';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default resumeService;
