'use client';

import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { useAppStore } from '@/store/useAppStore';
import {
  fmt, fmtS, colorClass, margen, mktTotals, finTotals,
  getMonthStr, nextMonthYear, monthDrift, historialResumen,
} from '@/lib/calculations';
import { MONTHS } from '@/lib/defaultState';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Historial() {
  const { state, setState } = useAppStore();
  const resumen = historialResumen(state);
  const drift = monthDrift(state);
  const now = new Date();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ facturado: number; gastos: number; n: number } | null>(null);

  function startEdit(idx: number, h: { facturado: number; gastos: number; n: number }) {
    setEditingIdx(idx);
    setEditDraft({ facturado: h.facturado, gastos: h.gastos, n: h.n });
  }

  function saveEdit(idx: number) {
    if (!editDraft) return;
    setState((prev) => ({
      ...prev,
      historial: prev.historial.map((h, i) => (i === idx
        ? { ...h, facturado: editDraft.facturado, gastos: editDraft.gastos, n: editDraft.n, rev: editDraft.facturado, cost: editDraft.gastos, ben: editDraft.facturado - editDraft.gastos }
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

  const all = [...state.historial].reverse();
  const chartData = {
    labels: all.map((h) => h.mes.slice(0, 3) + ' ' + h.year + (h.type === 'mkt' ? ' 🎯' : ' 💰')),
    datasets: [
      { label: 'Facturado', data: all.map((h) => h.rev || 0), backgroundColor: 'rgba(99,102,241,.6)', borderColor: '#6366F1', borderWidth: 1, borderRadius: 4 },
      {
        label: 'Beneficio', data: all.map((h) => h.ben || 0),
        backgroundColor: all.map((h) => (h.ben >= 0 ? 'rgba(16,185,129,.6)' : 'rgba(239,68,68,.6)')),
        borderColor: all.map((h) => (h.ben >= 0 ? '#10B981' : '#EF4444')),
        borderWidth: 1, borderRadius: 4,
      },
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

      {resumen.entradas > 0 && (
        <div className="g5" style={{ marginBottom: 16 }}>
          <div className="mc accent"><div className="mlbl">Facturado histórico</div><div className="mval accent">{fmt(resumen.totalFacturado)}</div><div className="msub">{resumen.entradas} meses cerrados</div></div>
          <div className={`mc ${resumen.totalBeneficio >= 0 ? 'green' : 'red'}`}><div className="mlbl">Beneficio histórico</div><div className={`mval ${resumen.totalBeneficio >= 0 ? 'green' : 'red'}`}>{fmtS(resumen.totalBeneficio)}</div><div className="msub">Promedio {fmt(resumen.promedioBeneficio)}/mes</div></div>
          <div className="mc blue"><div className="mlbl">Marketing (retainers)</div><div className="mval blue">{fmt(resumen.porTipo.mkt.facturado)}</div><div className="msub">{resumen.porTipo.mkt.n} meses archivados</div></div>
          <div className="mc amber"><div className="mlbl">Financiero (broker)</div><div className="mval amber">{fmt(resumen.porTipo.fin.facturado)}</div><div className="msub">{resumen.porTipo.fin.n} meses cerrados</div></div>
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

      {all.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="ctitle">📈 Evolución mensual — Ingresos vs Beneficio</div>
          <div className="chart-wrap"><Bar data={chartData} options={chartOptions} /></div>
        </div>
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
                  <div className="suggesttext">Beneficio recalculado: <span className="tier">{fmtS(editDraft.facturado - editDraft.gastos)}</span></div>
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
