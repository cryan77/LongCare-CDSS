/** Role-based access helpers aligned with doc/role.md */

export type AppRole = 'admin' | 'doctor' | 'nurse' | 'patient';

export function normalizeRole(role?: string | null): AppRole | null {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'doctor' || r === 'nurse' || r === 'patient') return r;
  return null;
}

export function homePathForRole(role?: string | null): string {
  switch (normalizeRole(role)) {
    case 'admin':
      return '/app/admin';
    case 'nurse':
      return '/app/nurse';
    case 'patient':
      return '/app/patient';
    case 'doctor':
    default:
      return '/app/dashboard';
  }
}

export function portalLabel(role?: string | null): string {
  switch (normalizeRole(role)) {
    case 'admin':
      return 'Admin Portal';
    case 'nurse':
      return 'Nurse Portal';
    case 'patient':
      return 'Patient Portal';
    case 'doctor':
      return 'Doctor Portal';
    default:
      return 'Clinical Portal';
  }
}

/** Which roles may access a route path prefix */
export const routeAccess: Record<string, AppRole[]> = {
  '/app/dashboard': ['doctor'],
  '/app/patients': ['doctor', 'nurse'],
  '/app/workspace': ['doctor', 'nurse'],
  '/app/workflow': ['doctor'],
  '/app/timeline': ['doctor', 'nurse'],
  '/app/imaging': ['doctor'],
  '/app/diagnosis': ['doctor'],
  '/app/treatment': ['doctor'],
  '/app/chat': ['doctor', 'nurse'],
  '/app/knowledge': ['doctor'],
  '/app/documentation': ['doctor'],
  '/app/admin': ['admin'],
  '/app/nurse': ['nurse'],
  '/app/patient': ['patient'],
};

export function canAccessPath(role: string | null | undefined, pathname: string): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  // Find longest matching prefix
  const match = Object.keys(routeAccess)
    .filter((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b.length - a.length)[0];
  if (!match) return r === 'doctor'; // unknown clinical paths default doctor
  return routeAccess[match].includes(r);
}

export type NavChild = { label: string; path: string };
export type NavGroup = {
  label: string;
  path?: string;
  icon: 'dashboard' | 'people' | 'ai' | 'imaging' | 'knowledge' | 'reports' | 'admin' | 'vitals' | 'meds' | 'tasks' | 'messages' | 'health' | 'appointments';
  children?: NavChild[];
};

export function navForRole(role?: string | null): NavGroup[] {
  switch (normalizeRole(role)) {
    case 'admin':
      return [
        { label: 'Dashboard', path: '/app/admin', icon: 'dashboard' },
        {
          label: 'Users',
          icon: 'people',
          children: [
            { label: 'All Users', path: '/app/admin/users' },
            { label: 'Roles', path: '/app/admin/users' },
          ],
        },
        {
          label: 'AI Configuration',
          icon: 'ai',
          children: [{ label: 'Models & Limits', path: '/app/admin/ai' }],
        },
        {
          label: 'Knowledge Base',
          icon: 'knowledge',
          children: [{ label: 'Guidelines & Ingest', path: '/app/admin/knowledge' }],
        },
        {
          label: 'Audit & Security',
          icon: 'admin',
          children: [
            { label: 'Audit Logs', path: '/app/admin/audit' },
            { label: 'Monitoring', path: '/app/admin/monitoring' },
          ],
        },
      ];
    case 'nurse':
      return [
        { label: 'Dashboard', path: '/app/nurse', icon: 'dashboard' },
        {
          label: 'Patients',
          icon: 'people',
          children: [
            { label: 'Patient List', path: '/app/patients' },
            { label: 'Care Workspace', path: '/app/workspace' },
          ],
        },
        { label: 'Vitals', path: '/app/nurse/vitals', icon: 'vitals' },
        { label: 'Medications', path: '/app/nurse/medications', icon: 'meds' },
        { label: 'Tasks', path: '/app/nurse/tasks', icon: 'tasks' },
        { label: 'Care Assistant', path: '/app/chat', icon: 'messages' },
      ];
    case 'patient':
      return [
        { label: 'Home', path: '/app/patient', icon: 'dashboard' },
        { label: 'My Health', path: '/app/patient/health', icon: 'health' },
        { label: 'Medications', path: '/app/patient/medications', icon: 'meds' },
        { label: 'Appointments', path: '/app/patient/appointments', icon: 'appointments' },
        { label: 'Health Assistant', path: '/app/patient/chat', icon: 'messages' },
      ];
    case 'doctor':
    default:
      return [
        { label: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
        {
          label: 'Patients',
          icon: 'people',
          children: [
            { label: 'Patient List', path: '/app/patients' },
            { label: 'Patient Workspace', path: '/app/workspace' },
          ],
        },
        {
          label: 'Clinical AI',
          icon: 'ai',
          children: [
            { label: 'Run CDSS', path: '/app/workflow' },
            { label: 'Diagnosis', path: '/app/diagnosis' },
            { label: 'Treatment', path: '/app/treatment' },
            { label: 'Medical Chat', path: '/app/chat' },
          ],
        },
        {
          label: 'Medical Imaging',
          icon: 'imaging',
          children: [{ label: 'X-Ray Analysis', path: '/app/imaging' }],
        },
        {
          label: 'Knowledge Base',
          icon: 'knowledge',
          children: [{ label: 'Search Guidelines', path: '/app/knowledge' }],
        },
        {
          label: 'Reports',
          icon: 'reports',
          children: [{ label: 'SOAP / Discharge', path: '/app/documentation' }],
        },
      ];
  }
}
