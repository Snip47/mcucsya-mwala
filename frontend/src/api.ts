import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8002/api';
const API      = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getBaseUrl = () => BASE_URL;

export interface User {
  id:             number;
  full_name:      string;
  role:           string;
  ward?:          string;
  position?:      string;
  profile_photo?: string;
  institution?:   string;
  national_id:    string;
  phone:          string;
  status:         string;
  course?:        string;
  year_of_study?: string;
}

export interface Post {
  id:          number;
  title:       string;
  content:     string;
  post_type:   string;
  image_url?:  string;
  author_name: string;
  author_role: string;
  is_pinned:   boolean;
  views:       number;
  created_at:  string;
}

export interface BursaryAnnouncement {
  id:          number;
  title:       string;
  content:     string;
  amount?:     number;
  deadline?:   string;
  author_name: string;
  image_url?:  string;
  created_at:  string;
}

export interface BursaryApplication {
  id:               number;
  institution:      string;
  course:           string;
  year_of_study:    number;
  amount_requested: number;
  reason:           string;
  status:           string;
  created_at:       string;
}

export interface Event {
  id:          number;
  title:       string;
  description: string;
  location:    string;
  event_date:  string;
  image_url?:  string;
  author_name: string;
  created_at:  string;
}

export const authAPI = {
  loginWithRole:  (national_id: string, password: string, role: string) => {
    const form = new FormData();
    form.append('national_id', national_id);
    form.append('password',    password);
    form.append('role',        role);
    return API.post('/auth/login', form);
  },
  registerMember: (data: FormData) => API.post('/auth/register/member', data),
  registerLeader: (data: FormData) => API.post('/auth/register/leader', data),
  registerMP:     (data: FormData) => API.post('/auth/register/mp',     data),
  updatePhoto:    (file: File, token: string) => {
    const form = new FormData();
    form.append('profile_photo', file);
    return axios.put(`${BASE_URL}/auth/update-photo`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

export const postsAPI = {
  getAll:  (type?: string) => API.get(`/posts${type ? `?post_type=${type}` : ''}`),
  create:  (data: FormData) => API.post('/posts', data),
  delete:  (id: number)    => API.delete(`/posts/${id}`),
};

export const opportunitiesAPI = {
  getAll:  ()               => API.get('/opportunities'),
  create:  (data: FormData) => API.post('/opportunities', data),
};

export const bursaryAPI = {
  getLinks:  ()               => API.get('/bursary/links'),
  postLink:  (data: FormData) => API.post('/bursary/link',  data),
  apply:     (data: FormData) => API.post('/bursary/apply', data),
  getMyApps: ()               => API.get('/bursary/my-applications'),
};

export const eventsAPI = {
  getAll: ()               => API.get('/events'),
  create: (data: FormData) => API.post('/events', data),
  rsvp:   (id: number)     => API.post(`/events/${id}/rsvp`),
};

export const adminAPI = {
  getPending:     ()                        => API.get('/admin/pending'),
  getAllMembers:   ()                        => API.get('/admin/all-members'),
  getAdmins:      ()                        => API.get('/admin/admins'),
  approve:        (id: number)              => API.put(`/admin/approve/${id}`),
  reject:         (id: number)              => API.put(`/admin/reject/${id}`),
  deleteUser:     (id: number)              => API.delete(`/admin/delete/${id}`),
  addAdmin:       (data: FormData)          => API.post('/admin/add-admin',  data),
  addMember:      (data: FormData)          => API.post('/admin/add-member', data),
  getBursaryApps: ()                        => API.get('/admin/bursary-applications'),
  updateBursary:  (id: number, status: string, notes: string) =>
    API.put(`/admin/bursary/${id}?status=${status}&admin_notes=${notes}`),
  getStats: () => API.get('/admin/stats'),
};