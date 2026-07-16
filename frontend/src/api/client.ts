import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Patient {
  id: number;
  mrn: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  medical_history: Record<string, unknown>;
  allergies: string[];
  vitals: Record<string, unknown>;
}

export interface DiagnosisResult {
  id?: number;
  encounter_id?: number;
  diagnosis: { name: string; probability: number }[];
  differential: string[];
  reasoning: string;
  evidence: { id: string; source: string; year?: number; excerpt: string; relevance: number }[];
  confidence: number;
  safety_flags: string[];
}

export interface TreatmentResult {
  id?: number;
  ids?: number[];
  medications: { name: string; dose: string; frequency: string; duration?: string }[];
  warnings: string[];
  guidelines: { source: string; excerpt: string }[];
  safety_checks: Record<string, boolean>;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const patientsApi = {
  list: () => api.get<Patient[]>('/patients').then((r) => r.data),
  get: (id: number) => api.get<Patient>(`/patients/${id}`).then((r) => r.data),
  createEncounter: (patientId: number, chiefComplaint: string) =>
    api.post('/patients/encounters', { patient_id: patientId, chief_complaint: chiefComplaint }).then((r) => r.data),
  updateVitals: (patientId: number, vitals: Record<string, unknown>) =>
    api.patch<Patient>(`/patients/${patientId}/vitals`, vitals).then((r) => r.data),
  addNursingNote: (patientId: number, note: string) =>
    api.post<Patient>(`/patients/${patientId}/nursing-notes`, { note }).then((r) => r.data),
};

export const diagnosisApi = {
  run: (payload: {
    patient_id: number;
    symptoms: string[];
    labs?: Record<string, number>;
    encounter_id?: number;
    images?: string[];
  }) => api.post<DiagnosisResult>('/diagnosis', payload).then((r) => r.data),
  workflow: (payload: {
    patient_id: number;
    symptoms: string[];
    labs?: Record<string, number>;
    encounter_id?: number;
    images?: string[];
  }) => api.post('/diagnosis/workflow', payload).then((r) => r.data),
  approve: (id: number, approved = true, edits?: Record<string, unknown>) =>
    api.patch(`/diagnosis/${id}/approve`, { approved, edits }).then((r) => r.data),
};

export const treatmentApi = {
  recommend: (payload: { patient_id: number; diagnosis_name?: string; diagnosis_id?: number }) =>
    api.post<TreatmentResult>('/treatment', payload).then((r) => r.data),
  approve: (id: number, approved = true, edits?: Record<string, unknown>) =>
    api.patch(`/treatment/${id}/approve`, { approved, edits }).then((r) => r.data),
};

export const chatApi = {
  send: (message: string, patientId?: number) =>
    api.post('/chat', { message, patient_id: patientId }).then((r) => r.data),
  history: () => api.get('/chat/history').then((r) => r.data),
};

export const docsApi = {
  generate: (encounterId: number, docType = 'soap') =>
    api.post('/documentation', { encounter_id: encounterId, doc_type: docType }).then((r) => r.data),
  approve: (id: number, approved = true, edits?: Record<string, unknown>) =>
    api.patch(`/documentation/${id}/approve`, { approved, edits }).then((r) => r.data),
  pdf: (docId: number) =>
    api.get(`/documentation/${docId}/pdf`, { responseType: 'blob' }).then((r) => r.data),
};

export const timelineApi = {
  get: (patientId: number) => api.get(`/patients/${patientId}/timeline`).then((r) => r.data),
};

export const imagingApi = {
  analyze: (formData: FormData) =>
    api
      .post('/images/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: () =>
    api
      .get<{ id: number; email: string; full_name: string; role: string }[]>('/admin/users')
      .then((r) => r.data),
  updateRole: (userId: number, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data),
  aiConfig: () => api.get('/admin/ai-config').then((r) => r.data),
  updateAiConfig: (payload: Record<string, unknown>) =>
    api.put('/admin/ai-config', payload).then((r) => r.data),
  audit: () => api.get<{ events: { time: string; user: string; action: string; patient: string; severity: string }[] }>('/admin/audit').then((r) => r.data),
  monitoring: () => api.get('/admin/monitoring').then((r) => r.data),
};
