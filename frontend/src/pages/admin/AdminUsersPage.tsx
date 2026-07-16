import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { adminApi } from '../../api/client';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.users,
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const permissions: Record<string, string[]> = {
    doctor: ['Diagnosis', 'Treatment', 'Reports', 'Patient Data', 'Imaging'],
    nurse: ['Vitals', 'Medications', 'Patient Data', 'Care Alerts'],
    admin: ['Users', 'Audit', 'AI Config', 'System'],
    patient: ['Own Record', 'Education Chat', 'Appointments'],
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Users & Roles
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage platform access. Role changes take effect on next session refresh.
      </Typography>

      {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Role update failed.</Alert>}
      {mutation.isSuccess && <Alert severity="success" sx={{ mb: 2 }}>Role updated.</Alert>}

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Permissions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4}>Loading…</TableCell>
                </TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={u.role}
                      onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value })}
                      sx={{ minWidth: 120 }}
                    >
                      {['doctor', 'nurse', 'admin', 'patient'].map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    {(permissions[u.role] || []).map((p) => (
                      <Chip key={p} label={p} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
