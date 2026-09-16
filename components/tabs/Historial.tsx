'use client';

import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { useAppStore } from '@/store/useAppStore';
import {
  fmt, fmtS, colorClass, margen, mktTotals, finTotals,
  getMonthStr, nextMonthYear, monthDrift, historialResumen, proyeccionMesEnCurso,
} from '@/lib/calculations';
import { MONTHS } from '@/lib/defaultState';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Historial() {
  const { state, setState } = useAppStore();
  const resumen = historialResumen(state);
  const drift = monthDrift(state);
  const proyeccion = proyeccionMesEnCurso(state);
  const now = new Date();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ facturado: number; gastos: number; n: number; month: number; year: number } | null>(null);

  function startEdit(idx: number, h: { facturado: number; gastos: number; n: number; month: number; year: number }) {
    setEditingIdx(idx);
    setEditDraft({ facturado: h.facturado, gastos: h.gastos, n: h.n, month: h.month, year: h.year });
  }

  function saveEdit(idx: number) {
    if (!editDraft) return;
    const mes = getMonthStr(editDraft.month, editDraft.year, MONTHS);
    setState((prev) => ({
      ...prev,
      historial: prev.historial.map((h, i) => (i === idx
        ? {
          ...h,
          facturado: editDraft.facturado, gastos: editDraft.gastos, n: editDraft.n,
          rev: editDraft.facturado, cost: editDraft.gastos, ben: editDraft.facturado - editDraft.gastos,
          month: editDraft.month, year: editDraft.year, mes,
        }
        : h)),
    }));
    setEditingIdx(null);
    setEditDraft(null);
  }

  function deleteHistorialEntry(idx: number, mes: string) {
    if (!confirm(`¿Eliminar ${mes} del histórico? Esta acción no se puede deshacer.`)) return;
    setState((prev) => ({ ...prev, historial: prev.historial.filter((_, i) => i !== idx) }));
  }

  function cerrarMesMkt() {
    const mes = getMonthStr(state.curMonth, state.curYear, MONTHS);
    if (!confirm(`Vas a archivar ${mes} de Marketing. Los clientes recurrentes se mantienen activos (no se borran, solo queda el snapshot del mes en el histórico).\n\n¿Confirmar?`)) return;
    const t = mktTotals(state);
    setState((prev) => ({
      ...prev,
      mkt_historial: [
        { mes, month: prev.curMonth, year: prev.curYear, type: 'mkt', rev: t.totalTp, cost: t.totalCost, ben: t.ben, n: t.n, facturado: t.totalTp, gastos: t.totalCost, clients: JSON.parse(JSON.stringify(prev.mkt_clients)) },
        ...prev.mkt_historial,
      ],
      historial: [
        { mes, month: prev.curMonth, year: prev.curYear, type: 'mkt', rev: t.totalTp, cost: t.totalCost, ben: t.ben, n: t.n, facturado: t.totalTp, gastos: t.totalCost, clients: JSON.parse(JSON.stringify(prev.mkt_clients)) },
        ...prev.historial,
      ],
    }));
    alert(`✅ ${mes} de Marketing archivado.`);
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
        { mes, month: prev.curMonth, year: prev.curYear, type: 'fin', rev: t.totalRev, cost: t.totalCost, ben: t.ben, n: t.n, facturado: t.totalRev, gastos: t.totalCost, clients: JSON.parse(JSON.stringify(prev.fin_clients)) },
        ...prev.historial,
      ],
      fin_clients: [],
      nextFinId: 10,
      curMonth: nm,
      curYear: ny,
    }));
    alert(`✅ ${mes} cerrado y archivado. El sistema pasa a ${mesSiguiente}. Financiero reiniciado.`);
  }

  // Meses reales distintos, ordenados cronológicamente — un mes = una etiqueta,
  // con Marketing y Financiero como barras agrupadas (en vez de un bloque por cierre,
  // que mostraba el mismo mes duplicado cuando ambos servicios cierran por separado).
  const monthKeys = Array.from(new Set(state.historial.map((e) => `${e.year}-${e.month}`))).sort((a, b) => {
    const [ay, am] = a.split('-').map(Number);
    const [by, bm] = b.split('-').map(Number);
    return (ay * 12 + am) - (by * 12 + bm);
  });
  const mktByMonth = new Map(state.historial.filter((e) => e.type === 'mkt').map((e) => [`${e.year}-${e.month}`, e]));
  const finByMonth = new Map(state.historial.filter((e) => e.type === 'fin').map((e) => [`${e.year}-${e.month}`, e]));

  // Tabla comparativa mes a mes (análisis avanzado, desplegable)
  const tablaMeses = monthKeys.map((k, i) => {
    const [y, m] = k.split('-').map(Number);
    const mkt = mktByMonth.get(k);
    const fin = finByMonth.get(k);
    const facturadoTotal = (mkt?.facturado || 0) + (fin?.facturado || 0);
    const gastosTotal = (mkt?.gastos || 0) + (fin?.gastos || 0);
    const benTotal = (mkt?.ben || 0) + (fin?.ben || 0);
    const prevKey = monthKeys[i - 1];
    let deltaPct: number | null = null;
    if (prevKey) {
      const prevBen = (mktByMonth.get(prevKey)?.ben || 0) + (finByMonth.get(prevKey)?.ben || 0);
      deltaPct = prevBen !== 0 ? ((benTotal - prevBen) / Math.abs(prevBen)) * 100 : null;
    }
    return { label: `${MONTHS[m]} ${y}`, mkt, fin, facturadoTotal, gastosTotal, benTotal, deltaPct };
  }).reverse(); // más reciente primero
  const chartData = {
    labels: monthKeys.map((k) => {
      const [y, m] = k.split('-').map(Number);
      return MONTHS[m].slice(0, 3) + ' ' + y;
    }),
    datasets: [
      { label: 'Marketing', data: monthKeys.map((k) => mktByMonth.get(k)?.ben ?? null), backgroundColor: 'rgba(99,102,241,.7)', borderColor: '#6366F1', borderWidth: 1, borderRadius: 4 },
      { label: 'Financiero', data: monthKeys.map((k) => finByMonth.get(k)?.ben ?? null), backgroundColor: 'rgba(16,185,129,.7)', borderColor: '#10B981', borderWidth: 1, borderRadius: 4 },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94A3B8', font: { size: 11, family: 'var(--font-space-grotesk)' } } },
      tooltip: {
        backgroundColor: '#1A2335', borderColor: '#1E2D45', borderWidth: 1, titleColor: '#E2E8F0', bodyColor: '#94A3B8',
        callbacks: { label: (i: { raw: unknown }) => ' €' + Number(i.raw).toLocaleString() },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(30,45,69,.4)' }, ticks: { color: '#64748B', font: { size: 10 } } },
      y: { grid: { color: 'rgba(30,45,69,.4)' }, ticks: { color: '#64748B', font: { size: 10 }, callback: (v: string | number) => '€' + Number(v).toLocaleString() } },
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 700 }}>Historial mensual</h2>
          <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 4 }}>Cada mes cerrado queda archivado con todos los datos.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="cmb" onClick={cerrarMesMkt} style={{ background: 'linear-gradient(135deg, var(--accent), #4F46E5)' }}>🎯 Cerrar mes Mkt</button>
          <button className="cmb" onClick={cerrarMes}>💰 Cerrar mes Fin</button>
        </div>
      </div>

      {drift > 0 && (
        <div className="ibox danger" style={{ marginBottom: 16 }}>
          ⚠ El sistema sigue marcando <strong>{MONTHS[state.curMonth]} {state.curYear}</strong> como mes actual, pero hoy es <strong>{MONTHS[now.getMonth()]} {now.getFullYear()}</strong>. Cierra el mes Financiero ({drift} {drift === 1 ? 'mes de atraso' : 'meses de atraso'}) para que todo lo nuevo se cuente en el mes correcto.
        </div>
      )}

      <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--card2), var(--card))', border: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div className="ctitle" style={{ margin: 0 }}>🔮 {MONTHS[state.curMonth]} {state.curYear} — mes en curso (proyectado a fin de mes)</div>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>Día {proyeccion.diaActual} de {proyeccion.diasDelMes}</span>
        </div>
        <div className="emp-kpi-strip" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div className="emp-kpi"><div className="ev vx">{fmt(proyeccion.mktActual)}</div><div className="el">Marketing (MRR, ya es el del mes)</div></div>
          <div className="emp-kpi"><div className="ev vg">{fmt(proyeccion.finActual)}</div><div className="el">Financiero acumulado hoy</div></div>
          <div className="emp-kpi"><div className="ev vm">{fmt(proyeccion.finProyectado)}</div><div className="el">Financiero proyectado a fin de mes</div></div>
          <div className="emp-kpi"><div className={`ev ${colorClass(proyeccion.benProyectado)}`}>{fmtS(proyeccion.benProyectado)}</div><div className="el">Beneficio total proyectado</div></div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>La proyección solo estira Financiero (flujo de cierres que se acumula día a día) — Marketing ya es un total mensual (MRR), no se multiplica por avance del mes.</p>
      </div>

      {resumen.entradas > 0 && (
        <div className="g5" style={{ marginBottom: 16 }}>
          <div className="mc accent"><div className="mlbl">Facturado histórico</div><div className="mval accent">{fmt(resumen.totalFacturado)}</div><div className="msub">{resumen.mesesReales} {resumen.mesesReales === 1 ? 'mes real' : 'meses reales'} · {resumen.entradas} cierres</div></div>
          <div className={`mc ${resumen.totalBeneficio >= 0 ? 'green' : 'red'}`}><div className="mlbl">Beneficio histórico</div><div className={`mval ${resumen.totalBeneficio >= 0 ? 'green' : 'red'}`}>{fmtS(resumen.totalBeneficio)}</div><div className="msub">Promedio {fmt(resumen.promedioBeneficio)}/mes real</div></div>
          <div className="mc blue"><div className="mlbl">Marketing (retainers)</div><div className="mval blue">{fmt(resumen.porTipo.mkt.facturado)}</div><div className="msub">{resumen.porTipo.mkt.n} archivados{resumen.rachaMkt > 0 ? ` · 🔥 racha ${resumen.rachaMkt}` : ''}</div></div>
          <div className="mc amber"><div className="mlbl">Financiero (broker)</div><div className="mval amber">{fmt(resumen.porTipo.fin.facturado)}</div><div className="msub">{resumen.porTipo.fin.n} cerrados{resumen.rachaFin > 0 ? ` · 🔥 racha ${resumen.rachaFin}` : ''}</div></div>
          {resumen.mejorMes && (
            <div className="mc green"><div className="mlbl">Mejor mes</div><div className="mval green">{fmtS(resumen.mejorMes.ben)}</div><div className="msub">{resumen.mejorMes.mes} ({resumen.mejorMes.type === 'mkt' ? 'Mkt' : 'Fin'})</div></div>
          )}
        </div>
      )}

      {(resumen.comparativaMkt?.anterior || resumen.comparativaFin?.anterior) && (
        <div className="g2" style={{ marginBottom: 16 }}>
          {resumen.comparativaMkt?.anterior && (
            <div className="ibox">
              🎯 <strong>Marketing</strong> — {resumen.comparativaMkt.actual.mes}: {fmtS(resumen.comparativaMkt.actual.ben)} de beneficio, {resumen.comparativaMkt.actual.n} clientes (vs {fmtS(resumen.comparativaMkt.anterior.ben)} y {resumen.comparativaMkt.anterior.n} clientes en {resumen.comparativaMkt.anterior.mes})
              {resumen.comparativaMkt.deltaPct !== null && (
                <> → <span className={colorClass(resumen.comparativaMkt.deltaPct)}>{resumen.comparativaMkt.deltaPct >= 0 ? '+' : ''}{resumen.comparativaMkt.deltaPct.toFixed(1)}%</span> en beneficio</>
              )}
            </div>
          )}
          {resumen.comparativaFin?.anterior && (
            <div className="ibox">
              💰 <strong>Financiero</strong> — {resumen.comparativaFin.actual.mes}: {fmtS(resumen.comparativaFin.actual.ben)} de beneficio, {resumen.comparativaFin.actual.n} clientes (vs {fmtS(resumen.comparativaFin.anterior.ben)} y {resumen.comparativaFin.anterior.n} clientes en {resumen.comparativaFin.anterior.mes})
              {resumen.comparativaFin.deltaPct !== null && (
                <> → <span className={colorClass(resumen.comparativaFin.deltaPct)}>{resumen.comparativaFin.deltaPct >= 0 ? '+' : ''}{resumen.comparativaFin.deltaPct.toFixed(1)}%</span> en beneficio</>
              )}
            </div>
          )}
        </div>
      )}

      {monthKeys.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="ctitle">📈 Beneficio por mes real — Marketing vs Financiero</div>
          <div className="chart-wrap"><Bar data={chartData} options={chartOptions} /></div>
        </div>
      )}

      {tablaMeses.length > 0 && (
        <details className="card" style={{ marginBottom: 16 }}>
          <summary style={{ cursor: 'pointer' }}><span className="ctitle" style={{ display: 'inline' }}>📊 Análisis avanzado — tabla comparativa mes a mes</span></summary>
          <div className="tscroll" style={{ marginTop: 12 }}>
            <table className="stbl">
              <thead>
                <tr><th>Mes</th><th>Facturado Mkt</th><th>Beneficio Mkt</th><th>Facturado Fin</th><th>Beneficio Fin</th><th>Beneficio total</th><th>Margen</th><th>vs. mes anterior</th></tr>
              </thead>
              <tbody>
                {tablaMeses.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className="vx">{row.mkt ? fmt(row.mkt.facturado) : '—'}</td>
                    <td className={row.mkt ? colorClass(row.mkt.ben) : ''}>{row.mkt ? fmtS(row.mkt.ben) : '—'}</td>
                    <td className="vg">{row.fin ? fmt(row.fin.facturado) : '—'}</td>
                    <td className={row.fin ? colorClass(row.fin.ben) : ''}>{row.fin ? fmtS(row.fin.ben) : '—'}</td>
                    <td className={colorClass(row.benTotal)} style={{ fontWeight: 700 }}>{fmtS(row.benTotal)}</td>
                    <td className="vm">{margen(row.benTotal, row.facturadoTotal)}</td>
                    <td>{row.deltaPct !== null ? <span className={colorClass(row.deltaPct)}>{row.deltaPct >= 0 ? '+' : ''}{row.deltaPct.toFixed(1)}%</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>"—" significa que ese servicio no cerró/archivó nada ese mes real, no que fue cero.</p>
        </details>
      )}

      {state.historial.length === 0 ? (
        <div className="ibox" style={{ textAlign: 'center', padding: 24 }}>Sin meses cerrados aún.</div>
      ) : (
        state.historial.map((h, idx) => (
          <div key={idx} className="hentry">
            <div className="hmonth">
              <span>{h.type === 'mkt' ? '🎯' : '💰'} {h.mes} — {h.type === 'mkt' ? 'Marketing' : 'Financiero'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={colorClass(h.ben)} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 15, fontWeight: 700 }}>{fmtS(h.ben)}</span>
                {editingIdx !== idx && (
                  <>
                    <button className="addbtn" style={{ width: 'auto', padding: '3px 9px', fontSize: 10 }} onClick={() => startEdit(idx, h)}>✏️ Editar</button>
                    <button className="rm-btn" onClick={() => deleteHistorialEntry(idx, h.mes)}>✕</button>
                  </>
                )}
              </div>
            </div>

            {editingIdx === idx && editDraft ? (
              <div className="ladderbox" style={{ marginTop: 10 }}>
                <div className="emp-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 10 }}>
                  <div className="emp-field">
                    <label>Mes</label>
                    <select className="sel" value={editDraft.month} onChange={(e) => setEditDraft({ ...editDraft, month: +e.target.value })}>
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div className="emp-field">
                    <label>Año</label>
                    <input type="number" className="inp" value={editDraft.year} onChange={(e) => setEditDraft({ ...editDraft, year: +e.target.value })} />
                  </div>
                </div>
                <div className="emp-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="emp-field">
                    <label>Facturado (€)</label>
                    <input type="number" className="inp" value={editDraft.facturado} onChange={(e) => setEditDraft({ ...editDraft, facturado: +e.target.value })} />
                  </div>
                  <div className="emp-field">
                    <label>Gastos (€)</label>
                    <input type="number" className="inp" value={editDraft.gastos} onChange={(e) => setEditDraft({ ...editDraft, gastos: +e.target.value })} />
                  </div>
                  <div className="emp-field">
                    <label>Clientes</label>
                    <input type="number" className="inp" min={0} value={editDraft.n} onChange={(e) => setEditDraft({ ...editDraft, n: +e.target.value })} />
                  </div>
                </div>
                <div className="suggestbar">
                  <div className="suggesttext">Quedará como <strong>{getMonthStr(editDraft.month, editDraft.year, MONTHS)}</strong> · Beneficio recalculado: <span className="tier">{fmtS(editDraft.facturado - editDraft.gastos)}</span></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="applybtn" onClick={() => saveEdit(idx)}>Guardar corrección</button>
                    <button className="applybtn applied" onClick={() => { setEditingIdx(null); setEditDraft(null); }}>Cancelar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hgrid">
                <div className="hkpi"><div className="hv vg">{fmt(h.facturado || h.rev)}</div><div className="hl">Facturado</div></div>
                <div className="hkpi"><div className="hv vr">{fmt(h.gastos || h.cost)}</div><div className="hl">Gastos</div></div>
                <div className="hkpi"><div className={`hv ${colorClass(h.ben)}`}>{fmtS(h.ben)}</div><div className="hl">Beneficio</div></div>
                <div className="hkpi"><div className="hv vm">{margen(h.ben, h.rev)}</div><div className="hl">Margen</div></div>
                <div className="hkpi"><div className="hv vx">{h.n}</div><div className="hl">Clientes</div></div>
              </div>
            )}

            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 11, color: 'var(--muted2)', cursor: 'pointer', padding: '4px 0' }}>Ver detalle clientes →</summary>
              <div style={{ marginTop: 8 }}>
                {(h.clients || []).map((c, i) => (
                  <div key={i} className="bi">
                    <span className="bn">#{i + 1} {c.name || `Cliente ${i + 1}`}</span>
                    <span className={`bv ${h.type === 'mkt' ? 'vx' : 'vg'}`}>
                      {h.type === 'mkt' ? fmt((c as { ticket: number }).ticket) + '/mes' : '$' + (c as { ticket_usd: number }).ticket_usd}
                    </span>
                  </div>
                ))}
                {(!h.clients || h.clients.length === 0) && (
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>Sin clientes en el snapshot — si te faltó agregar uno al momento de cerrar, usa "✏️ Editar" arriba para corregir el facturado y el número de clientes a mano.</p>
                )}
              </div>
            </details>
          </div>
        ))
      )}
    </div>
  );
}
