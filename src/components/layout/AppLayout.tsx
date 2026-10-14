import { Suspense, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CLINIC_NAME } from '../../config';
import { todayISO } from '../../lib/date';
import { formatDate } from '../../lib/format';
import { resetDb } from '../../services/db';
import { getNetworkMode, setNetworkMode, type NetworkMode } from '../../services/request';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Icon, type IconName } from '../ui/Icon';
import { SegmentedControl } from '../ui/SegmentedControl';
import { LoadingState } from '../ui/States';
import { useToast } from '../ui/Toast';
import './AppLayout.css';

const NAV_ITEMS: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/appointments', label: 'Appointments', icon: 'calendar' },
  { to: '/patients', label: 'Patients', icon: 'users' },
];

function NavItems({ className }: { className: string }) {
  return (
    <ul className={className}>
      {NAV_ITEMS.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.to === '/'} className="nav-link">
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

const NETWORK_OPTIONS: Array<{ value: NetworkMode; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'flaky', label: 'Flaky' },
  { value: 'offline', label: 'Offline' },
];

const NETWORK_HINTS: Record<NetworkMode, string> = {
  normal: 'All requests succeed.',
  flaky: 'About 30% of requests fail.',
  offline: 'Every request fails.',
};

/** Demo-only controls: reset seed data and simulate network failures. */
function DemoControls() {
  const toast = useToast();
  const [networkMode, setNetworkModeState] = useState(getNetworkMode);
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="demo-controls">
      <p className="demo-controls__title">Demo settings</p>
      <div className="demo-controls__field">
        <span className="demo-controls__label">
          Simulated network
        </span>
        <SegmentedControl
          size="sm"
          label="Simulated network"
          value={networkMode}
          onChange={(mode) => {
            setNetworkMode(mode);
            setNetworkModeState(mode);
          }}
          options={NETWORK_OPTIONS}
        />
        <span className="demo-controls__hint" aria-live="polite">{NETWORK_HINTS[networkMode]}</span>
      </div>
      <Button size="sm" variant="ghost" icon="refresh" onClick={() => setConfirmingReset(true)}>
        Reset demo data
      </Button>
      {confirmingReset && (
        <ConfirmDialog
          title="Reset demo data?"
          message="All patients, appointments and payments will be replaced with fresh sample data."
          confirmLabel="Reset data"
          tone="danger"
          onCancel={() => setConfirmingReset(false)}
          onConfirm={() => {
            resetDb();
            setConfirmingReset(false);
            toast.success('Demo data has been reset.');
          }}
        />
      )}
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="plus" size={18} />
          </span>
          <span className="brand__name">{CLINIC_NAME}</span>
        </div>
        <nav aria-label="Main">
          <NavItems className="sidebar__nav" />
        </nav>
        <div className="sidebar__footer">
          <p className="sidebar__date">{formatDate(todayISO())}</p>
          <DemoControls />
        </div>
      </aside>

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="plus" size={18} />
          </span>
          <span className="brand__name">{CLINIC_NAME}</span>
        </div>
        <span className="text-subtle">{formatDate(todayISO())}</span>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        <div className="main__inner">
          {/* Pages are lazy-loaded; keep the shell visible while one loads. */}
          <Suspense fallback={<LoadingState label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Main">
        <NavItems className="bottom-nav__list" />
      </nav>
    </div>
  );
}
