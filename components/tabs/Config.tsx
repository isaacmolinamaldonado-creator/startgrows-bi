'use client';

import { useAppStore } from '@/store/useAppStore';
import { CostItem } from '@/lib/types';

export default function Config() {
  const { state, setState } = useAppStore();

  function updateMktFixed(idx: number, amount: number) {
    setState((prev) => { const arr = [...prev.mkt_fixed]; arr[idx] = { ...arr[idx], amount }; return { ...prev, mkt_fixed: arr }; });
  }
  function toggleMktFixed(idx: number) {
    setState((prev) => { const arr = [...prev.mkt_fixed]; arr[idx] = { ...arr[idx], active: !arr[idx].active }; return { ...prev, mkt_fixed: arr }; });
  }
  function addMktFixed() {
    const name = prompt('Nombre del coste fijo:'); if (!name) return;
    const amount = parseFloat(prompt('Importe (€):') || '0');
    setState((prev) => ({ ...prev, mkt_fixed: [...prev.mkt_fixed, { id: Date.now(), name, amount, active: true }] }));
  }

  function updateMktVar(idx: number, amount: number) {
    setState((prev) => { const arr = [...prev.mkt_var]; arr[idx] = { ...arr[idx], amount }; return { ...prev, mkt_var: arr }; });
  }
  function toggleMktVar(idx: number) {
    setState((prev) => { const arr = [...prev.mkt_var]; arr[idx] = { ...arr[idx], active: !arr[idx].active }; return { ...prev, mkt_var: arr }; });
  }
  function addMktVar() {
    const name = prompt('Nombre del coste variable:'); if (!name) return;
    const amount = parseFloat(prompt('Importe por cliente (€):') || '0');
    setState((prev) => ({ ...prev, mkt_var: [...prev.mkt_var, { id: Date.now(), name, amount, active: true }] }));
  }

  function updateFinFixed(idx: number, amount: number) {
    setState((prev) => { const arr = [...prev.fin_fixed]; arr[idx] = { ...arr[idx], amount }; return { ...prev, fin_fixed: arr }; });
  }
  function toggleFinFixed(idx: number) {
    setState((prev) => { const arr = [...prev.fin_fixed]; arr[idx] = { ...arr[idx], active: !arr[idx].active }; return { ...prev, fin_fixed: arr }; });
  }
  function addFinFixed() {
    const name = prompt('Nombre del coste fijo:'); if (!name) return;
    const amount = parseFloat(prompt('Importe (€):') || '0');
    setState((prev) => ({ ...prev, fin_fixed: [...prev.fin_fixed, { id: Date.now(), name, amount, active: true }] }));
  }

  function updateCanalLabel(idx: number, label: string) {
    setState((prev) => {
      const arr = [...prev.canals];
      arr[idx] = { ...arr[idx], label, key: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') };
      return { ...prev, canals: arr };
    });
  }
  function updateCanalComm(idx: number, comm_usd: number) {
    setState((prev) => { const arr = [...prev.canals]; arr[idx] = { ...arr[idx], comm_usd }; return { ...prev, canals: arr }; });
  }
  function addCanal() {
    const label = prompt('Nombre del canal:'); if (!label) return;
    const usd = parseFloat(prompt('Comisión en USD:') || '0');
    setState((prev) => ({
      ...prev,
      canals: [...prev.canals, { id: prev.nextCanalId, key: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''), label, comm_usd: usd, active: true }],
      nextCanalId: prev.nextCanalId + 1,
    }));
  }
  function removeCanal(id: number) {
    if (state.canals.length <= 1) { alert('Debe haber al menos 1 canal.'); return; }
    if (!confirm('¿Eliminar este canal?')) return;
    setState((prev) => {
      const newCanals = prev.canals.filter((c) => c.id !== id);
      const fallback = newCanals[0].id;
      return {
        ...prev, canals: newCanals,
        fin_clients: prev.fin_clients.map((cl) => (newCanals.find((c) => c.id === cl.canal_id) ? cl : { ...cl, canal_id: fallback })),
      };
    });
  }

  return (
    <div>
      <div className="ibox" style={{ marginBottom: 16 }}>
        <strong>⚙️ Config global.</strong> Activa/desactiva costes. Todo actualiza en tiempo real.
      </div>
      <div className="g2">
        <div>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            Marketing <span className="tag tag-rec" style={{ padding: '3px 9px', borderRadius: 20, fontSize: 9 }}>RECURRENTE</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="ctitle">📌 Costes Fijos</div>
            <CostList items={state.mkt_fixed} onUpdate={updateMktFixed} onToggle={toggleMktFixed} />
            <button className="addbtn" style={{ marginTop: 9 }} onClick={addMktFixed}>+ Añadir</button>
          </div>
          <div className="card">
            <div className="ctitle">📦 Variables por cliente</div>
            <CostList items={state.mkt_var} onUpdate={updateMktVar} onToggle={toggleMktVar} />
            <button className="addbtn" style={{ marginTop: 9 }} onClick={addMktVar}>+ Añadir</button>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            Financiero <span className="tag tag-once" style={{ padding: '3px 9px', borderRadius: 20, fontSize: 9 }}>PAGO ÚNICO</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="ctitle">📌 Costes Fijos</div>
            <CostList items={state.fin_fixed} onUpdate={updateFinFixed} onToggle={toggleFinFixed} />
            <button className="addbtn fin" style={{ marginTop: 9 }} onClick={addFinFixed}>+ Añadir</button>
          </div>
          <div className="card">
            <div className="ctitle">📡 Canales (comisiones)</div>
            {state.canals.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto 28px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(30,45,69,.3)' }}>
                <input className="inp" style={{ fontSize: 12 }} value={c.label} onChange={(e) => updateCanalLabel(i, e.target.value)} />
                <input type="number" className="inp" min={0} style={{ width: 70, textAlign: 'right', padding: '5px 8px' }} value={c.comm_usd} onChange={(e) => updateCanalComm(i, +e.target.value)} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>USD</span>
                <button className="ctog" onClick={() => removeCanal(c.id)}>✕</button>
              </div>
            ))}
            <button className="addbtn fin" style={{ marginTop: 9 }} onClick={addCanal}>+ Añadir canal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostList({ items, onUpdate, onToggle }: { items: CostItem[]; onUpdate: (idx: number, amount: number) => void; onToggle: (idx: number) => void }) {
  return (
    <ul className="cost-list">
      {items.map((item, i) => (
        <li key={item.id} className={`ci ${item.active ? '' : 'off'}`}>
          <span className="ci-name">{item.name}</span>
          <input
            className="inp" style={{ width: 80, textAlign: 'right', padding: '5px 8px', fontSize: 12 }}
            type="number" min={0} value={item.amount}
            onChange={(e) => onUpdate(i, parseFloat(e.target.value) || 0)}
          />
          <button className="ctog" onClick={() => onToggle(i)}>{item.active ? '✓' : '✗'}</button>
        </li>
      ))}
    </ul>
  );
}
