'use client';

import { useAppStore } from '@/store/useAppStore';
import { FinClient, CostItem } from '@/lib/types';
import {
  fmt, fmtS, colorClass, margen, getMonthStr, nextMonthYear,
  finFixedTotal, finClientCalc, finTotals,
} from '@/lib/calculations';
import { MONTHS } from '@/lib/defaultState';
import { finCanalPill, getAlert } from '@/components/shared';

export default function Financiero() {
  const { state, setState } = useAppStore();
  const totals = finTotals(state);
  const fx = state.globalInputs.gfx;

  function updateClient(id: number, patch: Partial<FinClient>) {
    setState((prev) => ({
      ...prev,
      fin_clients: prev.fin_clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function addClient() {
    const defaultCanal = state.canals[0];
    setState((prev) => ({
      ...prev,
      fin_clients: [
        ...prev.fin_clients,
        {
          id: prev.nextFinId,
          name: 'Nuevo cierre',
          ticket_usd: prev.fin_def_ticket,
          canal_id: defaultCanal?.id || 1,
          closer: false,
          closedByEmployeeId: null,
        },
      ],
      nextFinId: prev.nextFinId + 1,
    }));
  }

  function removeClient(id: number) {
    setState((prev) => ({ ...prev, fin_clients: prev.fin_clients.filter((c) => c.id !== id) }));
  }

  function updateFixed(idx: number, amount: number) {
    setState((prev) => {
      const arr = [...prev.fin_fixed];
      arr[idx] = { ...arr[idx], amount };
      return { ...prev, fin_fixed: arr };
    });
  }
  function toggleFixed(idx: number) {
    setState((prev) => {
      const arr = [...prev.fin_fixed];
      arr[idx] = { ...arr[idx], active: !arr[idx].active };
      return { ...prev, fin_fixed: arr };
    });
  }
  function addFixed() {
    const name = prompt('Nombre del coste fijo:');
    if (!name) return;
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
    setState((prev) => {
      const arr = [...prev.canals];
      arr[idx] = { ...arr[idx], comm_usd };
      return { ...prev, canals: arr };
    });
  }
  function addCanal() {
    const label = prompt('Nombre del canal (ej: TikTok Ads):');
    if (!label) return;
    const usd = parseFloat(prompt('Comisión en USD (0 si sin comisión):') || '0');
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
        ...prev,
        canals: newCanals,
        fin_clients: prev.fin_clients.map((cl) => (newCanals.find((c) => c.id === cl.canal_id) ? cl : { ...cl, canal_id: fallback })),
      };
    });
  }

  function setDefTicket(v: number) {
    setState((prev) => ({ ...prev, fin_def_ticket: v, globalInputs: { ...prev.globalInputs, finDefTicket: v } }));
  }
  function setCloserUsd(v: number) {
    setState((prev) => ({ ...prev, fin_closer_usd: v, globalInputs: { ...prev.globalInputs, finCloserUsd: v } }));
  }

  function cerrarMes() {
    const mes = getMonthStr(state.curMonth, state.curYear, MONTHS);
    const { month: nm, year: ny } = nextMonthYear(state.curMonth, state.curYear);
    const mesSiguiente = getMonthStr(nm, ny, MONTHS);
    if (!confirm(`Vas a cerrar ${mes}.\n\nDesde ahora el sistema va a registrar todo como ${mesSiguiente} — aunque estés haciendo este cierre más tarde (ej. el día 1), lo que ya cargaste como "actual" quedará archivado como ${mes}, no como ${mesSiguiente}.\n\n¿Confirmar cierre de ${mes}?`)) return;
    const t = finTotals(state);
    setState((prev) => ({
      ...prev,
      historial: [
        {
          mes, month: prev.curMonth, year: prev.curYear, type: 'fin',
          rev: t.totalRev, cost: t.totalCost, ben: t.ben, n: t.n,
          facturado: t.totalRev, gastos: t.totalCost,
          clients: JSON.parse(JSON.stringify(prev.fin_clients)),
        },
        ...prev.historial,
      ],
      fin_clients: [],
      nextFinId: 10,
      curMonth: nm,
      curYear: ny,
    }));
    alert(`✅ ${mes} cerrado y archivado. El sistema pasa a ${mesSiguiente}. Financiero reiniciado.`);
  }

  const avgT = state.fin_clients.length
    ? state.fin_clients.reduce((s, c) => s + c.ticket_usd * fx, 0) / state.fin_clients.length
    : state.fin_def_ticket * fx;
  const avgV = state.fin_clients.length
    ? state.fin_clients.reduce((s, c) => s + finClientCalc(state, c).varC, 0) / state.fin_clients.length
    : (state.canals[2]?.comm_usd || 100) * fx;

  const defT = state.fin_def_ticket * fx;
  const sortedCanals = [...state.canals].sort((a, b) => a.comm_usd - b.comm_usd);

  return (
    <div className="g2">
      <div className="gleft">
        <div className="card">
          <div className="ctitle">⚙️ Config Financiero</div>
          <div className="ibox" style={{ marginBottom: 10, fontSize: 10 }}>
            <strong>Pago único</strong> por cliente. FX sincronizado con config global.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
              1 USD = <strong style={{ color: 'var(--accent2)' }}>{fx.toFixed(2)}</strong> EUR
            </div>
            <div>
              <label style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Ticket defecto (USD)</label>
              <input
                type="number" className="inp" min={0} value={state.fin_def_ticket}
                onChange={(e) => setDefTicket(+e.target.value)}
                style={{ width: 90, padding: '5px 8px', textAlign: 'right', marginTop: 3 }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ctitle">
            📌 Costes fijos Fin <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 10 }}>{fmt(finFixedTotal(state))}</span>
          </div>
          <CostList items={state.fin_fixed} onUpdate={updateFixed} onToggle={toggleFixed} />
          <button className="addbtn fin" style={{ marginTop: 9 }} onClick={addFixed}>+ Añadir coste fijo</button>
        </div>

        <div className="card">
          <div className="ctitle">📡 Canales de captación</div>
          <div className="ibox" style={{ marginBottom: 10, fontSize: 10 }}>
            Define nombre y comisión (USD) por canal. Se actualizan en todos los selectores automáticamente.
          </div>
          {state.canals.map((c, i) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto 28px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(30,45,69,.3)' }}>
              <input className="inp" style={{ fontSize: 12 }} value={c.label} onChange={(e) => updateCanalLabel(i, e.target.value)} />
              <input type="number" className="inp" min={0} placeholder="USD" style={{ width: 70, textAlign: 'right', padding: '5px 8px' }} value={c.comm_usd} onChange={(e) => updateCanalComm(i, +e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>USD</span>
              <button className="ctog" onClick={() => removeCanal(c.id)} title="Eliminar canal">✕</button>
            </div>
          ))}
          <button className="addbtn fin" style={{ marginTop: 9 }} onClick={addCanal}>+ Añadir canal</button>
        </div>

        <div className="card">
          <div className="ctitle">🔧 Closer instalación</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--muted2)' }}>Coste closer (USD)</label>
            <input
              type="number" className="inp" min={0} value={state.fin_closer_usd}
              onChange={(e) => setCloserUsd(+e.target.value)}
              style={{ width: 80, textAlign: 'right', padding: '5px 8px' }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>= {fmt(state.fin_closer_usd * fx)}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="g3" style={{ marginBottom: 14 }}>
          <div className="mc green">
            <div className="mlbl">Ingresos mes</div>
            <div className="mval green">{fmt(totals.totalRev)}</div>
            <div className="msub">{totals.n} cierre(s) únicos</div>
          </div>
          <div className="mc red">
            <div className="mlbl">Costes mes</div>
            <div className="mval red">{fmt(totals.totalCost)}</div>
            <div className="msub">Fijos + comisiones</div>
          </div>
          <div className="mc amber">
            <div className="mlbl">Beneficio mes</div>
            <div className="mval amber">{fmt(totals.ben)}</div>
            <div className="msub">Margen: {margen(totals.ben, totals.totalRev)}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 13 }}>
            <div className="ctitle" style={{ margin: 0 }}>
              💰 Cierres este mes <span style={{ marginLeft: 6, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--green)' }}>{state.fin_clients.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button onClick={addClient} className="addbtn fin" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }}>+ Nuevo cierre</button>
              <button className="cmb" onClick={cerrarMes}>🗓 Cerrar mes</button>
            </div>
          </div>
          {state.fin_clients.length === 0 && (
            <div className="ibox" style={{ textAlign: 'center', padding: 20 }}>Sin cierres este mes.</div>
          )}
          {state.fin_clients.map((cl, i) => {
            const c = finClientCalc(state, cl);
            const fpc = state.fin_clients.length > 0 ? finFixedTotal(state) / state.fin_clients.length : finFixedTotal(state);
            const netC = c.ben - fpc;
            return (
              <div key={cl.id} className="client-card">
                <div className="cc-head">
                  <div className="cc-num fin">{i + 1}</div>
                  <input
                    className="inp-name" style={{ flex: 1, maxWidth: 160 }}
                    value={cl.name}
                    onChange={(e) => updateClient(cl.id, { name: e.target.value })}
                  />
                  {finCanalPill(state.canals, cl.canal_id)}
                  {getAlert(netC)}
                  <span className={`cc-ben ${c.ben >= 0 ? 'cc-ben-p' : 'cc-ben-n'}`}>{fmt(c.ben)} neto</span>
                  <button className="rm-btn" onClick={() => removeClient(cl.id)}>✕</button>
                </div>
                <div className="cgrid">
                  <div className="cfield">
                    <label>Ticket (USD)</label>
                    <input type="number" className="inp" min={0} value={cl.ticket_usd} onChange={(e) => updateClient(cl.id, { ticket_usd: +e.target.value })} />
                  </div>
                  <div className="cfield">
                    <label>Ticket en EUR</label>
                    <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 16, fontWeight: 700, color: 'var(--green)', padding: '6px 0' }}>{fmt(c.tickEur)}</div>
                  </div>
                  <div className="cfield">
                    <label>Canal de captación</label>
                    <select className="sel" value={cl.canal_id} onChange={(e) => updateClient(cl.id, { canal_id: +e.target.value })}>
                      {state.canals.map((can) => (
                        <option key={can.id} value={can.id}>{can.label}{can.comm_usd > 0 ? ` (+$${can.comm_usd})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cfield" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 14 }}>
                    <button className={`tog ${cl.closer ? 'on' : ''}`} onClick={() => updateClient(cl.id, { closer: !cl.closer })}></button>
                    <label style={{ fontSize: 11, color: 'var(--muted2)', cursor: 'pointer' }} onClick={() => updateClient(cl.id, { closer: !cl.closer })}>
                      Closer (+${state.fin_closer_usd})
                    </label>
                  </div>
                  <div className="cfield full cstat">
                    Ticket: <span className="vg">{fmt(c.tickEur)}</span> &nbsp;|&nbsp; Comisión canal: <span className="vr">{fmt(c.comm)}</span>
                    {cl.closer && <> &nbsp;|&nbsp; Closer: <span className="vr">{fmt(c.closer)}</span></>}
                    &nbsp;|&nbsp; Neto: <span className={colorClass(c.ben)}>{fmt(c.ben)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="ctitle">📊 Proyección si cierras más</div>
          <div className="tscroll">
            <table className="stbl">
              <thead><tr><th>+Cierres</th><th>Ingresos</th><th>Costes</th><th>Beneficio</th><th>Margen</th></tr></thead>
              <tbody>
                {Array.from({ length: 7 }, (_, e) => {
                  const rev = totals.totalRev + avgT * e;
                  const cost = totals.totalCost + avgV * e;
                  const ben = rev - cost;
                  return (
                    <tr key={e} className={e === 0 ? 'hl' : ''}>
                      <td>{e === 0 ? 'Actual' : `+${e} cierre${e > 1 ? 's' : ''}`}</td>
                      <td className="vg">{fmt(rev)}</td>
                      <td className="vr">{fmt(cost)}</td>
                      <td className={colorClass(ben)}>{fmtS(ben)}</td>
                      <td className={colorClass(ben)}>{margen(ben, rev)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="ctitle">📡 Comparativa rentabilidad por canal</div>
          {sortedCanals.map((c, i) => {
            const comm = c.comm_usd * fx;
            const ben = defT - comm;
            return (
              <div key={c.id} className="bi" style={i === 0 ? { background: 'var(--gdim)', borderRadius: 6, padding: '4px 8px' } : undefined}>
                <span className="bn">
                  {finCanalPill(state.canals, c.id)} {c.label}
                  {i === 0 && <span style={{ color: 'var(--green)', fontSize: 9, fontWeight: 700 }}> ★ MEJOR</span>}
                </span>
                <span className="bv">
                  <span className="vr">-{fmt(comm)}</span> &nbsp;<span className={colorClass(ben)}>{fmtS(ben)}</span>
                </span>
              </div>
            );
          })}
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
