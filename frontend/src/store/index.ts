import { create } from 'zustand';
import type { DiagnosisResult, Patient, TreatmentResult } from '../api/client';

interface AuthState {
  token: string | null;
  user: { id: number; email: string; full_name: string; role: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

interface ClinicalState {
  selectedPatient: Patient | null;
  setSelectedPatient: (p: Patient | null) => void;
  lastDiagnosis: DiagnosisResult | null;
  setLastDiagnosis: (d: DiagnosisResult | null) => void;
  lastTreatment: TreatmentResult | null;
  setLastTreatment: (t: TreatmentResult | null) => void;
  encounterId: number | null;
  setEncounterId: (id: number | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));

export const useClinicalStore = create<ClinicalState>((set) => ({
  selectedPatient: null,
  setSelectedPatient: (p) => set({ selectedPatient: p }),
  lastDiagnosis: null,
  setLastDiagnosis: (d) => set({ lastDiagnosis: d }),
  lastTreatment: null,
  setLastTreatment: (t) => set({ lastTreatment: t }),
  encounterId: null,
  setEncounterId: (id) => set({ encounterId: id }),
}));
