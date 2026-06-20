'use client';

import { useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { useAppStore } from '@/store/useAppStore';
import {
  fmt, fmtS, colorClass, margen,
  mktFixedTotal, mktVarTotal, mktClientCalc, mktTotals,
  finFixedTotal, finClientCalc, finTotals, getCanalById,
} from '@/lib/calculations';
import { finCanalPill, getAlert } from '@/components/shared';
import { MONTHS } from '@/lib/defaultState';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const chartTextColor = '#94A3B8';
const chartGridColor = 'rgba(30,45,69,.5)';

export default function Overview() {
  const { state } = useAppStore();
  const mt = mktTotals(state);
  const ft = finTotals(state);
  const totalRev = mt.totalTp + ft.totalRev;
  const totalCost = mt.totalCost + ft.totalCost;
  const totalBen = totalRev - totalCost;
  const GOAL = 10000;

  const kpis = [
    { l: 'Ingresos totales', v: fmt(totalRev), cls: 'green', s: 'Ambos servicios' },
    { l: 'Costes totales', v: fmt(totalCost), cls: 'red', s: 'Fijos+variables' },
    { l: 'Beneficio neto', v: fmt(totalBen), cls: totalBen >= 0 ? 'green' : 'red', s: 'Margen: ' + margen(totalBen, totalRev) },
    { l: 'MRR Marketing', v: fmt(mt.totalTp), cls: 'accent', s: `${mt.n} clientes recurrentes` },
    { l: 'Fin. este mes', v: fmt(ft.totalRev), cls: 'amber', s: `${ft.n} cierres únicos` },
  ];

  const pct = Math.min(100, (totalBen / GOAL) * 100);
  const needed = Math.max(0, GOAL - totalBen);

  // Canal ranking
  const canalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.mkt_clients.forEach((c) => {
      const label = c.canal === 'ninguno' ? 'Sin canal' : c.canal === 'inbound' ? 'Inbound' : 'Outbound';
      counts[label] = (counts[label] || 0) + 1;
    });
    state.fin_clients.forEach((cl) => {
      const cn = getCanalById(state.canals, cl.canal_id);
      counts[cn.label] = (counts[cn.label] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [state]);
  const totalCanalClients = canalCounts.reduce((s, [, n]) => s + n, 0) || 1;

  // Break-even
  const fixed = mktFixedTotal(state) + finFixedTotal(state);
  const avgMktC = mt.n > 0 ? mt.totalTp / mt.n - mktVarTotal(state) : 0;
  const avgFinC = ft.n > 0 ? ft.totalRev / ft.n - ft.totalVar / ft.n : 430;
  const mktBE = avgMktC > 0 ? Math.ceil(fixed / avgMktC) : '∞';
  const finBE = avgFinC > 0 ? Math.ceil(fixed / avgFinC) : '∞';

  // Projection chart (6 months)
  const projectionData = useMemo(() => {
    const labels: string[] = [];
    const revData: number[] = [];
    const costData: number[] = [];
    const benData: number[] = [];
    const curRev = totalRev, curCost = totalCost;
    const mktN = state.mkt_clients.length;
    const avgMktT = mktN > 0 ? state.mkt_clients.reduce((s, c) => s + c.ticket, 0) / mktN : 900;
    const pctRate = state.globalInputs.mktPct / 100;
    const avgMktV = mktVarTotal(state);
    for (let i = 0; i <= 5; i++) {
      const m = (state.curMonth + i) % 12;
      const y = state.curYear + Math.floor((state.curMonth + i) / 12);
      labels.push(MONTHS[m].slice(0, 3) + ' ' + y);
      const extraT = avgMktT * pctRate * i;
      const extraC = avgMktV * i;
      revData.push(+(curRev + extraT).toFixed(0));
      costData.push(+(curCost + extraC).toFixed(0));
      benData.push(+(curRev + extraT - curCost - extraC).toFixed(0));
    }
    return { labels, revData, costData, benData };
  }, [state, totalRev, totalCost]);

  const lineChartData = {
    labels: projectionData.labels,
    datasets: [
      { label: 'Ingresos', data: projectionData.revData, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.1)', fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'Costes', data: projectionData.costData, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,.05)', fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'Beneficio', data: projectionData.benData, borderColor: '#818CF8', backgroundColor: 'rgba(129,140,248,.08)', fill: true, tension: 0.4, pointRadius: 4 },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: chartTextColor, font: { size: 11, family: 'var(--font-space-grotesk)' } } },
      tooltip: { backgroundColor: '#1A2335', borderColor: '#1E2D45', borderWidth: 1, titleColor: '#E2E8F0', bodyColor: chartTextColor },
    },
    scales: {
      x: { grid: { color: chartGridColor }, ticks: { color: chartTextColor, font: { size: 10 } } },
      y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor, font: { size: 10 }, callback: (v: string | number) => '€' + Number(v).toLocaleString() } },
    },
  };

  const ingPieData = {
    labels: ['Marketing', 'Financiero'],
    datasets: [{ data: [mt.totalTp, ft.totalRev], backgroundColor: ['#6366F1', '#10B981'], borderColor: '#111827', borderWidth: 3 }],
  };
  const canalPieData = {
    labels: canalCounts.map(([name]) => name),
    datasets: [{
      data: canalCounts.map(([, n]) => n),
      backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'],
      borderColor: '#111827', borderWidth: 3,
    }],
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: chartTextColor, font: { size: 10, family: 'var(--font-space-grotesk)' }, padding: 12 } },
      tooltip: { backgroundColor: '#1A2335', borderColor: '#1E2D45', borderWidth: 1, titleColor: '#E2E8F0', bodyColor: chartTextColor },
    },
  };

  const mktFpc = mt.n > 0 ? mktFixedTotal(state) / mt.n : mktFixedTotal(state);
  const finFpc = ft.n > 0 ? finFixedTotal(state) / ft.n : finFixedTotal(state);

  return (
    <div>
      <div className="g5" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (
          <div key={k.l} className={`mc ${k.cls}`}>
            <div className="mlbl">{k.l}</div>
            <div className={`mval ${k.cls}`}>{k.v}</div>
            <div className="msub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="ctitle">🎯 Objetivo mensual — €10.000</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 28, fontWeight: 700, color: totalBen >= GOAL ? 'var(--green)' : totalBen > 0 ? 'var(--amber)' : 'var(--red)' }}>
              {fmt(totalBen)} <span style={{ fontSize: 14, color: 'var(--muted)' }}>/ €10.000</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {totalBen >= GOAL ? '🎉 ¡Objetivo alcanzado!' : needed > 0 ? `Faltan ${fmt(needed)} para el objetivo` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 22, fontWeight: 700, color: 'var(--accent2)' }}>{pct.toFixed(1)}%</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>del objetivo</div>
          </div>
        </div>
        <div className="goal-bar">
          <div className="goal-fill" style={{ width: `${pct}%`, background: totalBen >= GOAL ? 'var(--green)' : totalBen >= GOAL * 0.5 ? 'var(--amber)' : 'var(--red)' }}></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div className={`ibox ${totalBen >= GOAL ? 'success' : needed > 0 ? 'danger' : ''}`} style={{ flex: 1, minWidth: 180 }}>
            {totalBen >= GOAL ? <><strong>✅ Superado</strong> — excedes por <strong>{fmt(totalBen - GOAL)}</strong>.</> : needed > 0 ? <><strong>Faltan {fmt(needed)}</strong> para llegar a €10k.</> : ''}
          </div>
          <div className="ibox" style={{ flex: 1, minWidth: 180 }}>
            Para llegar a €10k solo con Mkt necesitas <strong>{Math.ceil(Math.max(0, GOAL - mt.ben + mt.totalCost) / Math.max(1, mt.totalTp / Math.max(1, mt.n)))} clientes</strong> más aprox.
          </div>
          <div className="ibox" style={{ flex: 1, minWidth: 180 }}>
            O cerrar <strong>{Math.ceil(Math.max(0, GOAL - totalBen) / Math.max(1, ft.totalRev / Math.max(1, ft.n) || 430))} cierres</strong> adicionales de Financiero este mes.
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 16 }}>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="ctitle">📡 Ranking de canales por rentabilidad</div>
            {canalCounts.length === 0 && <div className="ibox">Sin datos de canales aún.</div>}
            {canalCounts.map(([name, n], i) => {
              const pctShare = (n / totalCanalClients) * 100;
              return (
                <div key={name} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--muted2)' }}>{i === 0 ? '★ ' : ''}<strong>{name}</strong></span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent2)' }}>{n} cliente{n > 1 ? 's' : ''} ({pctShare.toFixed(0)}%)</span>
                  </div>
                  <div className="goal-bar" style={{ height: 6 }}>
                    <div className="goal-fill" style={{ width: `${pctShare}%`, background: i === 0 ? 'var(--green)' : i === 1 ? 'var(--accent)' : 'var(--blue)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="ctitle">💡 Break-even &amp; alertas</div>
            <div className="bi"><span className="bn">Total costes fijos</span><span className="bv vr">{fmt(fixed)}</span></div>
            <div className="bi"><span className="bn">Beneficio actual</span><span className={`bv ${colorClass(totalBen)}`}>{fmtS(totalBen)}</span></div>
            <div className="sep"></div>
            <div className={`ibox ${totalBen >= 0 ? 'success' : 'danger'}`} style={{ marginBottom: 8 }}>
              {totalBen >= 0
                ? <><strong>✅ Break-even superado</strong> — generando <strong>{fmt(totalBen)}/mes</strong>.</>
                : <><strong>⚠️ Break-even NO alcanzado</strong> — faltan {fmt(Math.abs(totalBen))}.</>}
            </div>
            <div className="bi"><span className="bn">BE solo Mkt (~{mktBE} clientes)</span><span className="bv vx">{fmt(avgMktC)}/cli</span></div>
            <div className="bi"><span className="bn">BE solo Fin (~{finBE} cierres/mes)</span><span className="bv vg">{fmt(avgFinC)}/cierre</span></div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="ctitle">📈 Proyección a 6 meses (escenario actual)</div>
            <div className="chart-wrap"><Line data={lineChartData} options={lineChartOptions} /></div>
          </div>
          <div className="g2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <div className="ctitle">🔵 Distribución de ingresos</div>
              <div className="chart-wrap-sm">{(mt.totalTp || ft.totalRev) ? <Doughnut data={ingPieData} options={pieOptions} /> : <div className="ibox">Sin datos</div>}</div>
            </div>
            <div className="card">
              <div className="ctitle">📊 Canal clientes (total)</div>
              <div className="chart-wrap-sm">{canalCounts.length > 0 ? <Doughnut data={canalPieData} options={pieOptions} /> : <div className="ibox">Sin datos</div>}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ctitle">🎯 Rentabilidad por cliente Marketing</div>
          <div className="tscroll">
            <table className="stbl">
              <thead><tr><th>Cliente</th><th>Ticket</th><th>Tu parte</th><th>Costes</th><th>Neto</th><th>Estado</th></tr></thead>
              <tbody>
                {state.mkt_clients.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>Sin clientes</td></tr>
                )}
                {state.mkt_clients.map((cl) => {
                  const c = mktClientCalc(state, cl);
                  const netC = c.ben - mktFpc;
                  return (
                    <tr key={cl.id}>
                      <td>{cl.name}</td>
                      <td className="vm">{fmt(cl.ticket)}</td>
                      <td className="vx">{fmt(c.tp)}</td>
                      <td className="vr">{fmt(c.cost + mktFpc)}</td>
                      <td className={colorClass(netC)}>{fmtS(netC)}</td>
                      <td>{getAlert(netC)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="ctitle">💰 Cierres Financiero (mes actual)</div>
          <div className="tscroll">
            <table className="stbl">
              <thead><tr><th>Cliente</th><th>Ticket €</th><th>Canal</th><th>Var.</th><th>Neto</th><th>Estado</th></tr></thead>
              <tbody>
                {state.fin_clients.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>Sin cierres</td></tr>
                )}
                {state.fin_clients.map((cl) => {
                  const c = finClientCalc(state, cl);
                  const netC = c.ben - finFpc;
                  return (
                    <tr key={cl.id}>
                      <td>{cl.name}</td>
                      <td className="vg">{fmt(c.tickEur)}</td>
                      <td>{finCanalPill(state.canals, cl.canal_id)}</td>
                      <td className="vr">{fmt(c.varC)}</td>
                      <td className={colorClass(netC)}>{fmtS(netC)}</td>
                      <td>{getAlert(netC)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
