import { Canal } from '@/lib/types';
import { getCanalById } from '@/lib/calculations';

const MKT_CANAL_LABELS: Record<string, string> = {
  ninguno: 'Sin canal',
  inbound: 'Inbound',
  outbound: 'Outbound',
};
const MKT_CANAL_CLASS: Record<string, string> = {
  ninguno: 'cp-no',
  inbound: 'cp-in',
  outbound: 'cp-out',
};

/** Pill para canal de Marketing (string key: ninguno/inbound/outbound) */
export function canalPill(canal: string) {
  const cls = MKT_CANAL_CLASS[canal] || 'cp-no';
  const lbl = MKT_CANAL_LABELS[canal] || canal;
  return <span className={`cp ${cls}`}>{lbl}</span>;
}

/** Pill para canal de Financiero (objeto Canal dinámico) */
export function finCanalPill(canals: Canal[], canalId: number) {
  const c = getCanalById(canals, canalId);
  const keyClass: Record<string, string> = {
    ninguno: 'cp-no', inbound: 'cp-in', outbound: 'cp-out', agencia: 'cp-ag', meta: 'cp-meta', afiliacion: 'cp-afil',
  };
  const cls = keyClass[c.key] || 'cp-no';
  return <span className={`cp ${cls}`}>{c.label}</span>;
}

export function getAlert(ben: number) {
  if (ben < 0) return <span className="alert-ok alert-d">⚠ PÉRDIDA</span>;
  if (ben < 80) return <span className="alert-ok alert-w">⚡ BAJO</span>;
  return <span className="alert-ok">✓ OK</span>;
}
