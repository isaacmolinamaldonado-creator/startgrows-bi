'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { useAppStore } from '@/store/useAppStore';
import { fmt, fmtS, colorClass, margen, mktTotals, finTotals } from '@/lib/calculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Historial() {
  const { state, setState } = useAppStore();

  function cerrarMesMkt() {
    if (!confirm('¿Cerrar mes Marketing actual?')) return;
    const t = mktTotals(state);
    const mes = `${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][state.curMonth]} ${state.curYear}`;
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
    alert('✅ Mes Marketing archivado.');
  }

  function cerrarMes() {
    if (!confirm('¿Cerrar mes Financiero actual?')) return;
    const t = finTotals(state);
    const mes = `${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][state.curMonth]} ${state.curYear}`;
    setState((prev) => {
      let nextMonth = prev.curMonth + 1;
      let nextYear = prev.curYear;
      if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
      return {
        ...prev,
        historial: [
          { mes, month: prev.curMonth, year: prev.curYear, type: 'fin', rev: t.totalRev, cost: t.totalCost, ben: t.ben, n: t.n, facturado: t.totalRev, gastos: t.totalCost, clients: JSON.parse(JSON.stringify(prev.fin_clients)) },
          ...prev.historial,
        ],
        fin_clients: [],
        nextFinId: 10,
        curMonth: nextMonth,
        curYear: nextYear,
      };
    });
    alert('✅ Mes Financiero cerrado. Financiero reiniciado.');
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
              <span className={colorClass(h.ben)} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 15, fontWeight: 700 }}>{fmtS(h.ben)}</span>
            </div>
            <div className="hgrid">
              <div className="hkpi"><div className="hv vg">{fmt(h.facturado || h.rev)}</div><div className="hl">Facturado</div></div>
              <div className="hkpi"><div className="hv vr">{fmt(h.gastos || h.cost)}</div><div className="hl">Gastos</div></div>
              <div className="hkpi"><div className={`hv ${colorClass(h.ben)}`}>{fmtS(h.ben)}</div><div className="hl">Beneficio</div></div>
              <div className="hkpi"><div className="hv vm">{margen(h.ben, h.rev)}</div><div className="hl">Margen</div></div>
              <div className="hkpi"><div className="hv vx">{h.n}</div><div className="hl">Clientes</div></div>
            </div>
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
              </div>
            </details>
          </div>
        ))
      )}
    </div>
  );
}
