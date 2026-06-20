'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Employee, Commission } from '@/lib/types';
import { fmt, calcCommissionAmount, mktClientCalc, finClientCalc } from '@/lib/calculations';

interface CommissionModalProps {
  employee: Employee;
  onClose: () => void;
}

type SourceMode = 'mkt' | 'fin' | 'manual';

export default function CommissionModal({ employee, onClose }: CommissionModalProps) {
  const { state, setState } = useAppStore();
  const [mode, setMode] = useState<SourceMode>('mkt');
  const [selectedMktId, setSelectedMktId] = useState<number | null>(state.mkt_clients[0]?.id ?? null);
  const [selectedFinId, setSelectedFinId] = useState<number | null>(state.fin_clients[0]?.id ?? null);
  const [manualLabel, setManualLabel] = useState('');
  const [manualAmount, setManualAmount] = useState(0);
  const [pct, setPct] = useState(10);
  const [note, setNote] = useState('');

  // Base amount depende del modo
  let baseAmount = 0;
  let clientLabel = '';
  if (mode === 'mkt' && selectedMktId) {
    const cl = state.mkt_clients.find((c) => c.id === selectedMktId);
    if (cl) {
      baseAmount = mktClientCalc(state, cl).tp;
      clientLabel = cl.name;
    }
  } else if (mode === 'fin' && selectedFinId) {
    const cl = state.fin_clients.find((c) => c.id === selectedFinId);
    if (cl) {
      baseAmount = finClientCalc(state, cl).tickEur;
      clientLabel = cl.name;
    }
  } else if (mode === 'manual') {
    baseAmount = manualAmount;
    clientLabel = manualLabel || 'Comisión manual';
  }

  const commissionAmount = calcCommissionAmount(baseAmount, pct);

  function handleSave() {
    if (mode === 'manual' && !manualLabel.trim()) {
      alert('Escribe el nombre del cliente o concepto.');
      return;
    }
    if ((mode === 'mkt' && !selectedMktId) || (mode === 'fin' && !selectedFinId)) {
      alert('Selecciona un cliente.');
      return;
    }

    const newCommission: Commission = {
      id: state.nextCommissionId,
      employeeId: employee.id,
      type: mode,
      mktClientId: mode === 'mkt' ? selectedMktId : null,
      finClientId: mode === 'fin' ? selectedFinId : null,
      clientLabel,
      amount: baseAmount,
      pct,
      commissionAmount,
      date: new Date().toISOString(),
      note,
    };

    setState((prev) => {
      const updated = { ...prev, commissions: [newCommission, ...prev.commissions], nextCommissionId: prev.nextCommissionId + 1 };
      // Vincula el cliente cerrado a este empleado (para conteo de "clientes cerrados")
      if (mode === 'mkt' && selectedMktId) {
        updated.mkt_clients = updated.mkt_clients.map((c) => (c.id === selectedMktId ? { ...c, closedByEmployeeId: employee.id } : c));
      }
      if (mode === 'fin' && selectedFinId) {
        updated.fin_clients = updated.fin_clients.map((c) => (c.id === selectedFinId ? { ...c, closedByEmployeeId: employee.id } : c));
      }
      return updated;
    });

    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="ctitle" style={{ margin: 0 }}>💸 Registrar comisión — {employee.name || 'Empleado'}</div>
          <button className="rm-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
        </div>

        <div className="mode-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['mkt', 'fin', 'manual'] as SourceMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="addbtn"
              style={{
                width: 'auto', padding: '6px 12px', fontSize: 11,
                background: mode === m ? 'var(--xdim)' : 'transparent',
                color: mode === m ? 'var(--accent2)' : 'var(--muted2)',
                borderColor: mode === m ? 'var(--accent)' : 'var(--border2)',
              }}
            >
              {m === 'mkt' ? '🎯 Cliente Marketing' : m === 'fin' ? '💰 Cliente Financiero' : '✏️ Manual'}
            </button>
          ))}
        </div>

        {mode === 'mkt' && (
          <div className="cfield" style={{ marginBottom: 12 }}>
            <label>Selecciona cliente de Marketing</label>
            <select className="sel" value={selectedMktId ?? ''} onChange={(e) => setSelectedMktId(+e.target.value)}>
              {state.mkt_clients.length === 0 && <option value="">Sin clientes disponibles</option>}
              {state.mkt_clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {fmt(c.ticket)}/mes</option>
              ))}
            </select>
          </div>
        )}

        {mode === 'fin' && (
          <div className="cfield" style={{ marginBottom: 12 }}>
            <label>Selecciona cierre de Financiero</label>
            <select className="sel" value={selectedFinId ?? ''} onChange={(e) => setSelectedFinId(+e.target.value)}>
              {state.fin_clients.length === 0 && <option value="">Sin cierres disponibles</option>}
              {state.fin_clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — ${c.ticket_usd}</option>
              ))}
            </select>
          </div>
        )}

        {mode === 'manual' && (
          <>
            <div className="cfield" style={{ marginBottom: 12 }}>
              <label>Nombre del cliente / concepto</label>
              <input className="inp" value={manualLabel} onChange={(e) => setManualLabel(e.target.value)} placeholder="ej: Cliente externo, bono especial..." />
            </div>
            <div className="cfield" style={{ marginBottom: 12 }}>
              <label>Importe base (€)</label>
              <input type="number" className="inp" min={0} value={manualAmount} onChange={(e) => setManualAmount(+e.target.value)} />
            </div>
          </>
        )}

        <div className="cfield" style={{ marginBottom: 12 }}>
          <label>% de comisión para {employee.name || 'el empleado'}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="range" min={0} max={100} value={pct}
              onChange={(e) => setPct(+e.target.value)}
              style={{ flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, appearance: 'none', cursor: 'pointer', border: 'none', padding: 0 }}
            />
            <input
              type="number" className="inp" min={0} max={100} value={pct}
              onChange={(e) => setPct(+e.target.value)}
              style={{ width: 60, textAlign: 'right' }}
            />
          </div>
        </div>

        <div className="cfield" style={{ marginBottom: 16 }}>
          <label>Nota (opcional)</label>
          <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ej: primer cierre del mes" />
        </div>

        <div className="ibox success" style={{ marginBottom: 16, fontSize: 13 }}>
          Base: <strong>{fmt(baseAmount)}</strong> × <strong>{pct}%</strong> = comisión de <strong style={{ fontSize: 16 }}>{fmt(commissionAmount)}</strong> para {employee.name || 'el empleado'}
        </div>

        <button className="login-btn" onClick={handleSave}>Guardar comisión</button>
      </div>
    </div>
  );
}
