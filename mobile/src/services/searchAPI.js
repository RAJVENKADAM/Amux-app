import api from './api';

export const searchAPI = {
  search: (query, type = 'all', page = 1, limit = 20) =>
    api.get('/search', { params: { q: query, type, page, limit } }),
};

export const courseSearchAPI = {
  searchCourses: (query, page = 1, limit = 20) => searchAPI.search(query, 'projects', page, limit),
};

export const tutorSearchAPI = {
  searchTutors: (query, page = 1, limit = 20) => searchAPI.search(query, 'users', page, limit),
};

