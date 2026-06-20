'use client';

export type TabKey = 'overview' | 'marketing' | 'financiero' | 'personal' | 'historial' | 'costes';

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '📊 Overview' },
  { key: 'marketing', label: '🎯 Marketing' },
  { key: 'financiero', label: '💰 Financiero' },
  { key: 'personal', label: '👤 Personal' },
  { key: 'historial', label: '📅 Historial' },
  { key: 'costes', label: '⚙️ Config' },
];

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="tabs-wrap">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`tab-btn ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
