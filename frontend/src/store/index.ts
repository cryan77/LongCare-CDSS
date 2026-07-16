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
  lastDocumentId: number | null;
  setLastDocumentId: (id: number | null) => void;
  treatmentIds: number[];
  setTreatmentIds: (ids: number[]) => void;
  workflowResult: Record<string, unknown> | null;
  setWorkflowResult: (r: Record<string, unknown> | null) => void;
  resetClinical: () => void;
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

const clinicalDefaults = {
  selectedPatient: null as Patient | null,
  lastDiagnosis: null as DiagnosisResult | null,
  lastTreatment: null as TreatmentResult | null,
  encounterId: null as number | null,
  lastDocumentId: null as number | null,
  treatmentIds: [] as number[],
  workflowResult: null as Record<string, unknown> | null,
};

export const useClinicalStore = create<ClinicalState>((set) => ({
  ...clinicalDefaults,
  setSelectedPatient: (p) => set({ selectedPatient: p }),
  setLastDiagnosis: (d) => set({ lastDiagnosis: d }),
  setLastTreatment: (t) => set({ lastTreatment: t }),
  setEncounterId: (id) => set({ encounterId: id }),
  setLastDocumentId: (id) => set({ lastDocumentId: id }),
  setTreatmentIds: (ids) => set({ treatmentIds: ids }),
  setWorkflowResult: (r) =>
    set({
      workflowResult: r,
      lastDocumentId: (r?.document_id as number) ?? null,
      treatmentIds: (r?.treatment_ids as number[]) ?? [],
    }),
  resetClinical: () => set({ ...clinicalDefaults }),
}));
