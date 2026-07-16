import { Box, Card, CardContent, Typography } from '@mui/material';

type KpiProps = {
  label: string;
  value: string | number;
  color?: string;
  hint?: string;
};

export function KpiCard({ label, value, color = 'primary.dark', hint }: KpiProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h5" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h2" sx={{ color, mt: 1, fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

type WidgetProps = {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function DashboardWidget({ title, children, action }: WidgetProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
          <Typography variant="h4">{title}</Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function StatusRow({
  name,
  status,
  ok,
}: {
  name: string;
  status: string;
  ok: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2">{name}</Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 650, color: ok ? 'success.main' : 'warning.main' }}
      >
        {status}
      </Typography>
    </Box>
  );
}
