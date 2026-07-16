import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { patientsApi } from '../../api/client';
import { useClinicalStore } from '../../store';
import PatientHeader from '../../components/Patient/PatientHeader';

export default function NurseVitalsPage() {
  const { selectedPatient, setSelectedPatient } = useClinicalStore();
  const qc = useQueryClient();
  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: patientsApi.list });

  const [bp, setBp] = useState(String(selectedPatient?.vitals?.bp ?? '120/80'));
  const [hr, setHr] = useState(String(selectedPatient?.vitals?.hr ?? '72'));
  const [temp, setTemp] = useState(String(selectedPatient?.vitals?.temp ?? '36.8'));
  const [rr, setRr] = useState(String(selectedPatient?.vitals?.rr ?? '16'));
  const [spo2, setSpo2] = useState(String(selectedPatient?.vitals?.spo2 ?? '98'));
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      patientsApi.updateVitals(selectedPatient!.id, {
        bp,
        hr: parseInt(hr, 10),
        temp: parseFloat(temp),
        rr: parseInt(rr, 10),
        spo2: parseInt(spo2, 10),
        notes: notes || undefined,
      }),
    onSuccess: (updated) => {
      setSelectedPatient(updated);
      setNotes('');
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Vitals Entry
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Record vital signs and nursing observations for physician review.
      </Typography>

      <TextField
        select
        fullWidth
        label="Select patient"
        sx={{ mb: 2, maxWidth: 420 }}
        value={selectedPatient?.id ?? ''}
        onChange={(e) => {
          const p = patients.find((x) => x.id === Number(e.target.value));
          if (p) {
            setSelectedPatient(p);
            setBp(String(p.vitals?.bp ?? '120/80'));
            setHr(String(p.vitals?.hr ?? '72'));
            setTemp(String(p.vitals?.temp ?? '36.8'));
            setRr(String(p.vitals?.rr ?? '16'));
            setSpo2(String(p.vitals?.spo2 ?? '98'));
          }
        }}
      >
        {patients.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.first_name} {p.last_name} ({p.mrn})
          </MenuItem>
        ))}
      </TextField>

      {!selectedPatient && <Alert severity="warning">Select a patient to record vitals.</Alert>}
      {selectedPatient && <PatientHeader patient={selectedPatient} />}

      {selectedPatient && (
        <Card sx={{ maxWidth: 640 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Blood Pressure" value={bp} onChange={(e) => setBp(e.target.value)} />
              <TextField label="Heart Rate" value={hr} onChange={(e) => setHr(e.target.value)} type="number" />
              <TextField label="Temperature (°C)" value={temp} onChange={(e) => setTemp(e.target.value)} type="number" />
              <TextField label="Respiratory Rate" value={rr} onChange={(e) => setRr(e.target.value)} type="number" />
              <TextField label="Oxygen Saturation (%)" value={spo2} onChange={(e) => setSpo2(e.target.value)} type="number" />
            </Box>
            <TextField
              fullWidth
              label="Nursing notes"
              margin="normal"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Patient reports nausea…"
            />
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Save Vitals
            </Button>
            {mutation.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Vitals saved to chart.</Alert>}
            {mutation.isError && <Alert severity="error" sx={{ mt: 2 }}>Save failed.</Alert>}
            <Alert severity="info" sx={{ mt: 2 }}>
              Nurses cannot approve diagnoses or prescribe medications.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
