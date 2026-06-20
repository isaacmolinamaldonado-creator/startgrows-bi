'use client';

import { useAppStore } from '@/store/useAppStore';
import { MONTHS } from '@/lib/defaultState';

interface TopBarProps {
  onLogout: () => void;
}

export default function TopBar({ onLogout }: TopBarProps) {
  const { state, saveStatus } = useAppStore();

  const statusConfig = {
    idle: { color: '#64748B', text: 'Iniciando…' },
    saving: { color: '#F59E0B', text: 'Guardando…' },
    ok: { color: '#10B981', text: 'Sincronizado' },
    error: { color: '#EF4444', text: 'Sin conexión' },
  } as const;

  const cfg = statusConfig[saveStatus];

  return (
    <div className="topbar">
      <div className="logo">
        <div className="logo-icon">🚀</div>
        StartGrows <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>&nbsp;/ BI</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="mbadge">{MONTHS[state.curMonth]} {state.curYear}</div>
        <div className="badge-live" style={{ color: cfg.color, borderColor: cfg.color + '40' }}>
          <div className="dot" style={{ background: cfg.color }}></div>
          {cfg.text}
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Salir
        </button>
      </div>
    </div>
  );
}
