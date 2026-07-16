import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { adminApi } from '../../api/client';

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: adminApi.audit,
  });

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Audit Trail
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Accountability log for clinical and administrative actions.
      </Typography>

      <Card>
        <CardContent>
          {isLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Patient / Scope</TableCell>
                <TableCell>Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.events || []).map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(e.time).toLocaleString()}</TableCell>
                  <TableCell>{e.user}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>{e.patient}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={e.severity}
                      color={e.severity === 'clinical' ? 'warning' : 'default'}
                      variant="outlined"
                    />
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
