'use client';

import { useAppStore } from '@/store/useAppStore';
import { MktClient, CostItem } from '@/lib/types';
import {
  fmt, fmtS, colorClass, margen, getMonthStr,
  mktFixedTotal, mktVarTotal, mktClientCalc, mktTotals,
} from '@/lib/calculations';
import { MONTHS } from '@/lib/defaultState';
import { canalPill, getAlert } from '@/components/shared';

export default function Marketing() {
  const { state, setState } = useAppStore();
  const totals = mktTotals(state);

  function updateClient(id: number, patch: Partial<MktClient>) {
    setState((prev) => ({
      ...prev,
      mkt_clients: prev.mkt_clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function addClient() {
    setState((prev) => ({
      ...prev,
      mkt_clients: [
        ...prev.mkt_clients,
        {
          id: prev.nextMktId,
          name: 'Nuevo cliente',
          ticket: 900,
          pct: prev.globalInputs.mktPct,
          canal: 'ninguno',
          varExtra: 0,
          months: 0,
          closedByEmployeeId: null,
        },
      ],
      nextMktId: prev.nextMktId + 1,
    }));
  }

  function removeClient(id: number) {
    setState((prev) => ({ ...prev, mkt_clients: prev.mkt_clients.filter((c) => c.id !== id) }));
  }

  function updateFixed(idx: number, amount: number) {
    setState((prev) => {
      const arr = [...prev.mkt_fixed];
      arr[idx] = { ...arr[idx], amount };
      return { ...prev, mkt_fixed: arr };
    });
  }
  function toggleFixed(idx: number) {
    setState((prev) => {
      const arr = [...prev.mkt_fixed];
      arr[idx] = { ...arr[idx], active: !arr[idx].active };
      return { ...prev, mkt_fixed: arr };
    });
  }
  function addFixed() {
    const name = prompt('Nombre del coste fijo:');
    if (!name) return;
    const amount = parseFloat(prompt('Importe (€):') || '0');
    setState((prev) => ({ ...prev, mkt_fixed: [...prev.mkt_fixed, { id: Date.now(), name, amount, active: true }] }));
  }

  function updateVar(idx: number, amount: number) {
    setState((prev) => {
      const arr = [...prev.mkt_var];
      arr[idx] = { ...arr[idx], amount };
      return { ...prev, mkt_var: arr };
    });
  }
  function toggleVar(idx: number) {
    setState((prev) => {
      const arr = [...prev.mkt_var];
      arr[idx] = { ...arr[idx], active: !arr[idx].active };
      return { ...prev, mkt_var: arr };
    });
  }
  function addVar() {
    const name = prompt('Nombre del coste variable:');
    if (!name) return;
    const amount = parseFloat(prompt('Importe por cliente (€):') || '0');
    setState((prev) => ({ ...prev, mkt_var: [...prev.mkt_var, { id: Date.now(), name, amount, active: true }] }));
  }

  function setGlobalPct(v: number) {
    setState((prev) => ({ ...prev, globalInputs: { ...prev.globalInputs, mktPct: v } }));
  }
  function setFx(v: number) {
    setState((prev) => ({ ...prev, globalInputs: { ...prev.globalInputs, gfx: v } }));
  }

  function cerrarMesMkt() {
    const mes = getMonthStr(state.curMonth, state.curYear, MONTHS);
    if (!confirm(`Vas a archivar ${mes} de Marketing. Los clientes recurrentes se mantienen activos (no se borran, solo queda el snapshot del mes en el histórico).\n\n¿Confirmar?`)) return;
    const t = mktTotals(state);
    setState((prev) => ({
      ...prev,
      mkt_historial: [
        {
          mes, month: prev.curMonth, year: prev.curYear, type: 'mkt',
          rev: t.totalTp, cost: t.totalCost, ben: t.ben, n: t.n,
          facturado: t.totalTp, gastos: t.totalCost,
          clients: JSON.parse(JSON.stringify(prev.mkt_clients)),
        },
        ...prev.mkt_historial,
      ],
      historial: [
        {
          mes, month: prev.curMonth, year: prev.curYear, type: 'mkt',
          rev: t.totalTp, cost: t.totalCost, ben: t.ben, n: t.n,
          facturado: t.totalTp, gastos: t.totalCost,
          clients: JSON.parse(JSON.stringify(prev.mkt_clients)),
        },
        ...prev.historial,
      ],
    }));
    alert('✅ Mes Marketing archivado. Los clientes se mantienen activos.');
  }

  const avgMonths = state.mkt_clients.length
    ? (state.mkt_clients.reduce((s, c) => s + (c.months || 0), 0) / state.mkt_clients.length).toFixed(1)
    : '0';
  const avgBenPerClient = state.mkt_clients.length ? totals.ben / state.mkt_clients.length : 0;

  const avgTicket = state.mkt_clients.length
    ? state.mkt_clients.reduce((s, c) => s + c.ticket, 0) / state.mkt_clients.length
    : 900;
  const pct = state.globalInputs.mktPct / 100;
  const avgVar = mktVarTotal(state);
  const scenarios = [
    { l: 'Situación actual', e: 0, cur: true },
    { l: '-1 cliente', e: -1, cur: false },
    { l: '+1 cliente', e: 1, cur: false },
    { l: '+2 clientes', e: 2, cur: false },
    { l: '+3 clientes', e: 3, cur: false },
    { l: '+5 clientes', e: 5, cur: false },
  ];

  return (
    <div className="g2">
      <div className="gleft">
        <div className="card">
          <div className="ctitle">⚙️ Config global Marketing</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Tu % por defecto
              </label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="range" min={0} max={100}
                  value={state.globalInputs.mktPct}
                  onChange={(e) => setGlobalPct(+e.target.value)}
                  style={{ flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, appearance: 'none', cursor: 'pointer', border: 'none', padding: 0 }}
                />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--accent2)', minWidth: 34 }}>
                  {state.globalInputs.mktPct}%
                </span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                FX USD→EUR
              </label>
              <input
                type="number" className="inp" step={0.01} min={0.01}
                value={state.globalInputs.gfx}
                onChange={(e) => setFx(+e.target.value)}
                style={{ padding: '6px 9px', fontSize: 12 }}
              />
            </div>
          </div>
          <div className="ibox" style={{ fontSize: 10 }}>
            Cada cliente tiene su propio ticket, canal y costes. Los fijos se comparten.
          </div>
        </div>

        <div className="card">
          <div className="ctitle">
            📌 Costes fijos Mkt <span style={{ marginLeft: 'auto', color: 'var(--accent2)', fontSize: 10 }}>{fmt(mktFixedTotal(state))}</span>
          </div>
          <CostList items={state.mkt_fixed} onUpdate={updateFixed} onToggle={toggleFixed} />
          <button className="addbtn" style={{ marginTop: 9 }} onClick={addFixed}>+ Añadir coste fijo</button>
        </div>

        <div className="card">
          <div className="ctitle">
            📦 Costes variables/cliente <span style={{ marginLeft: 'auto', color: 'var(--accent2)', fontSize: 10 }}>{fmt(mktVarTotal(state))}/cli</span>
          </div>
          <CostList items={state.mkt_var} onUpdate={updateVar} onToggle={toggleVar} />
          <button className="addbtn" style={{ marginTop: 9 }} onClick={addVar}>+ Añadir variable</button>
        </div>
      </div>

      <div>
        <div className="g3" style={{ marginBottom: 14 }}>
          <div className="mc accent">
            <div className="mlbl">MRR Total (tu parte)</div>
            <div className="mval accent">{fmt(totals.totalTp)}</div>
            <div className="msub">{totals.n} clientes activos</div>
          </div>
          <div className="mc red">
            <div className="mlbl">Costes totales</div>
            <div className="mval red">{fmt(totals.totalCost)}</div>
            <div className="msub">Fijos + variables</div>
          </div>
          <div className="mc green">
            <div className="mlbl">Beneficio neto</div>
            <div className="mval green">{fmt(totals.ben)}</div>
            <div className="msub">Margen: {margen(totals.ben, totals.totalTp)}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 13 }}>
            <div className="ctitle" style={{ margin: 0 }}>
              👥 Clientes activos <span style={{ marginLeft: 6, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--accent2)' }}>{state.mkt_clients.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button onClick={addClient} className="addbtn" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }}>+ Nuevo cliente</button>
              <button className="cmb" onClick={cerrarMesMkt}>🗓 Cerrar mes Mkt</button>
            </div>
          </div>
          {state.mkt_clients.length === 0 && (
            <div className="ibox" style={{ textAlign: 'center', padding: 20 }}>Sin clientes activos. Añade el primero.</div>
          )}
          {state.mkt_clients.map((cl, i) => {
            const c = mktClientCalc(state, cl);
            const fixedPerClient = state.mkt_clients.length > 0 ? mktFixedTotal(state) / state.mkt_clients.length : mktFixedTotal(state);
            const netWithFixed = c.ben - fixedPerClient;
            return (
              <div key={cl.id} className="client-card">
                <div className="cc-head">
                  <div className="cc-num">{i + 1}</div>
                  <input
                    className="inp-name" style={{ flex: 1, maxWidth: 160 }}
                    value={cl.name}
                    onChange={(e) => updateClient(cl.id, { name: e.target.value })}
                  />
                  {canalPill(cl.canal)}
                  {getAlert(netWithFixed)}
                  <span className={`cc-ben ${c.ben >= 0 ? 'cc-ben-p' : 'cc-ben-n'}`}>{fmt(c.ben)}/mes</span>
                  <button className="rm-btn" onClick={() => removeClient(cl.id)}>✕</button>
                </div>
                <div className="cgrid">
                  <div className="cfield">
                    <label>Ticket mensual (€)</label>
                    <input type="number" className="inp" min={0} value={cl.ticket} onChange={(e) => updateClient(cl.id, { ticket: +e.target.value })} />
                  </div>
                  <div className="cfield">
                    <label>Tu % (global={state.globalInputs.mktPct}%)</label>
                    <input type="number" className="inp" min={0} max={100} value={cl.pct} onChange={(e) => updateClient(cl.id, { pct: +e.target.value })} />
                  </div>
                  <div className="cfield">
                    <label>Canal captación</label>
                    <select className="sel" value={cl.canal} onChange={(e) => updateClient(cl.id, { canal: e.target.value as MktClient['canal'] })}>
                      <option value="ninguno">Sin setter</option>
                      <option value="inbound">Setter Inbound (+€40)</option>
                      <option value="outbound">Setter Outbound (+€85)</option>
                    </select>
                  </div>
                  <div className="cfield">
                    <label>Var. extra este cliente (€)</label>
                    <input type="number" className="inp" min={0} value={cl.varExtra || 0} onChange={(e) => updateClient(cl.id, { varExtra: +e.target.value })} />
                  </div>
                  <div className="cfield">
                    <label>Meses con nosotros</label>
                    <input type="number" className="inp" min={0} value={cl.months || 0} onChange={(e) => updateClient(cl.id, { months: +e.target.value })} />
                  </div>
                  <div className="cfield full cstat">
                    Tu parte: <span className="vx">{fmt(c.tp)}</span> &nbsp;|&nbsp; Var.estándar: <span className="vr">{fmt(mktVarTotal(state))}</span> &nbsp;|&nbsp; Setter: <span className="vr">{fmt(c.setter)}</span>
                    {cl.varExtra > 0 && <> &nbsp;|&nbsp; Extra: <span className="vr">{fmt(cl.varExtra)}</span></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="ctitle">📊 Proyección escenarios</div>
          <div className="tscroll">
            <table className="stbl">
              <thead><tr><th>Escenario</th><th>Tu parte</th><th>Costes</th><th>Beneficio</th><th>Margen</th></tr></thead>
              <tbody>
                {scenarios.map((s) => {
                  const eRev = s.e > 0 ? avgTicket * pct * s.e : s.e < 0 ? -(avgTicket * pct * Math.abs(s.e)) : 0;
                  const eCost = s.e > 0 ? avgVar * s.e : s.e < 0 ? -(avgVar * Math.abs(s.e)) : 0;
                  const rev = totals.totalTp + eRev;
                  const cost = totals.totalCost + eCost;
                  const ben = rev - cost;
                  return (
                    <tr key={s.l} className={s.cur ? 'hl' : ''}>
                      <td>{s.l}</td>
                      <td className="vx">{fmt(rev)}</td>
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

        <div className="g2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="ctitle">⏱ Antigüedad media clientes</div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 36, fontWeight: 700, color: 'var(--accent2)' }}>{avgMonths}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>meses promedio</div>
            </div>
            <div className="sep"></div>
            {state.mkt_clients.map((c) => (
              <div key={c.id} className="bi"><span className="bn">{c.name}</span><span className="bv vx">{c.months || 0} m</span></div>
            ))}
          </div>
          <div className="card">
            <div className="ctitle">📈 LTV proyectado (12m)</div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 36, fontWeight: 700, color: 'var(--green)' }}>{fmt(avgBenPerClient * 12)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>€ por cliente a 12 meses</div>
            </div>
            <div className="sep"></div>
            <div className="bi"><span className="bn">Beneficio actual/cliente</span><span className={`bv ${colorClass(avgBenPerClient)}`}>{fmtS(avgBenPerClient)}</span></div>
            <div className="bi"><span className="bn">LTV 6m</span><span className="bv vg">{fmt(avgBenPerClient * 6)}</span></div>
            <div className="bi"><span className="bn">LTV 12m</span><span className="bv vg">{fmt(avgBenPerClient * 12)}</span></div>
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
