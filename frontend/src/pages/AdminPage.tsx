import {
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const users = [
  { name: 'Dr. Sarah Chen', role: 'Doctor', status: 'Active', permissions: ['Diagnosis', 'Reports', 'Patient Data'] },
  { name: 'Alex Rivera, RN', role: 'Nurse', status: 'Active', permissions: ['Vitals', 'Patient Data'] },
  { name: 'System Admin', role: 'Admin', status: 'Active', permissions: ['Users', 'Audit', 'System'] },
];

const audit = [
  { time: '2026-07-16 10:30', user: 'Dr. Sarah Chen', action: 'Viewed AI diagnosis', patient: 'James Morrison' },
  { time: '2026-07-16 10:42', user: 'Dr. Sarah Chen', action: 'Approved treatment plan', patient: 'James Morrison' },
  { time: '2026-07-16 11:05', user: 'Alex Rivera, RN', action: 'Opened patient workspace', patient: 'Emily Nguyen' },
];

export default function AdminPage() {
  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Administration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Users, roles, and audit trail for clinical accountability.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Users
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Permissions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.name}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Chip label={u.status} size="small" color="success" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {u.permissions.map((p) => (
                      <Chip key={p} label={p} size="small" sx={{ mr: 0.5 }} variant="outlined" />
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Audit Trail
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Patient</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audit.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{a.time}</TableCell>
                  <TableCell>{a.user}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.patient}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
