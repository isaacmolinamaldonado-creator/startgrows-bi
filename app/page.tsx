'use client';

import { useState } from 'react';
import { AppStoreProvider, useAppStore } from '@/store/useAppStore';
import Login from '@/components/Login';
import TopBar from '@/components/TopBar';
import Tabs, { TabKey } from '@/components/Tabs';
import Overview from '@/components/tabs/Overview';
import Marketing from '@/components/tabs/Marketing';
import Financiero from '@/components/tabs/Financiero';
import Personal from '@/components/tabs/Personal';
import Historial from '@/components/tabs/Historial';
import Config from '@/components/tabs/Config';

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const { isLoaded } = useAppStore();

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)', fontSize: 13 }}>
        Cargando datos…
      </div>
    );
  }

  return (
    <div>
      <TopBar onLogout={onLogout} />
      <Tabs active={activeTab} onChange={setActiveTab} />
      <div className="main">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'marketing' && <Marketing />}
        {activeTab === 'financiero' && <Financiero />}
        {activeTab === 'personal' && <Personal />}
        {activeTab === 'historial' && <Historial />}
        {activeTab === 'costes' && <Config />}
      </div>
    </div>
  );
}

export default function Home() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <AppStoreProvider>
      <Dashboard onLogout={() => setAuthed(false)} />
    </AppStoreProvider>
  );
}
