import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { AdminLoginModal } from './AdminLoginModal';
import { isAdminAuthenticated } from '../lib/admin';
import { SiteHeader } from './SiteHeader';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const openAdmin = () => {
    if (isAdminAuthenticated()) window.location.assign('/fighters');
    else setShowAdminLogin(true);
  };

  return (
    <>
      <SiteHeader
        title="GOMO Muaythai Arena"
        subtitle="Athlete Management & Live Scores"
        theme={theme}
        onToggleTheme={onToggleTheme}
        primaryAction={{
          icon: <ShieldCheck className="h-4 w-4" />,
          onClick: openAdmin,
          label: 'Open fighter administration',
          title: 'Fighter administration',
          testId: 'arena-admin-button',
        }}
      />
      {showAdminLogin && (
        <AdminLoginModal
          onDismiss={() => setShowAdminLogin(false)}
          onSuccess={() => window.location.assign('/fighters')}
        />
      )}
    </>
  );
}
