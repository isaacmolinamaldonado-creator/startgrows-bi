'use client';

import { useAppStore } from '@/store/useAppStore';
import {
  fmt, mktTotals, finTotals, empMonthlySalary, empTotalPaidLifetime,
} from '@/lib/calculations';
import EmployeeCard from '@/components/personal/EmployeeCard';
import JobsList from '@/components/personal/JobsList';
import MeetingsList from '@/components/personal/MeetingsList';

export default function Personal() {
  const { state, setState } = useAppStore();

  function addEmployee() {
    setState((prev) => ({
      ...prev,
      employees: [
        ...prev.employees,
        {
          id: prev.nextEmpId, name: '', role: prev.roles[0], country: 'España', phone: '', email: '',
          fixedSalary: 0, bonus: 0, startDate: new Date().toISOString().slice(0, 10), workload: 50, active: true,
        },
      ],
      nextEmpId: prev.nextEmpId + 1,
    }));
  }

  const teamMonthly = state.employees.filter((e) => e.active).reduce((s, e) => s + empMonthlySalary(e), 0);
  const mt = mktTotals(state);
  const ft = finTotals(state);
  const totalGen = mt.totalTp + ft.totalRev;
  const pctOfRev = totalGen > 0 ? ((teamMonthly / totalGen) * 100).toFixed(1) : '0';
  const overloadedCount = state.employees.filter((e) => e.active && (e.workload || 0) >= 85).length;

  const kpis = [
    { l: 'Equipo activo', v: String(state.employees.filter((e) => e.active).length), cls: 'accent', s: `${state.employees.length} total registrados` },
    { l: 'Gasto fijo mensual', v: fmt(teamMonthly), cls: 'red', s: 'Salarios + bonus' },
    { l: '% sobre ingresos', v: pctOfRev + '%', cls: Number(pctOfRev) > 30 ? 'amber' : 'green', s: 'Personal vs facturación' },
    { l: 'Vacantes abiertas', v: String(state.jobs.filter((j) => j.status === 'open').length), cls: 'blue', s: `${state.jobs.length} puestos totales` },
    { l: 'Saturados', v: String(overloadedCount), cls: overloadedCount > 0 ? 'red' : 'green', s: 'Carga ≥85%' },
  ];

  const ranges = [
    { l: 'Este mes', m: 1 },
    { l: '3 meses', m: 3 },
    { l: '6 meses', m: 6 },
    { l: '1 año', m: 12 },
    { l: '2 años', m: 24 },
  ];

  const totalHistoricoPagado = state.employees.reduce((s, e) => s + empTotalPaidLifetime(state, e), 0);
  const totalComisionesPagadas = state.commissions.reduce((s, c) => s + c.commissionAmount, 0);

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

      <div className="g2" style={{ marginBottom: 16 }}>
        <div className="gleft">
          <div className="card">
            <div className="ctitle">📊 Overview de gasto en personal</div>
            <div className="ibox" style={{ marginBottom: 10, fontSize: 10 }}>
              Pagado (salarios + comisiones) vs generado por el equipo en distintos periodos.
            </div>
            {ranges.map((r) => {
              const paid = teamMonthly * r.m;
              const generated = totalGen * r.m;
              const ratio = generated > 0 ? ((paid / generated) * 100).toFixed(1) : '0';
              return (
                <div key={r.l} className="bi">
                  <span className="bn">{r.l}</span>
                  <span className="bv">
                    <span className="vr">{fmt(paid)} pagado</span> &nbsp;|&nbsp; <span className="vg">{fmt(generated)} generado</span> &nbsp;|&nbsp; <span className="vm">{ratio}%</span>
                  </span>
                </div>
              );
            })}
            <div className="sep"></div>
            <div className="ibox">
              Histórico total estimado: <strong>{fmt(totalHistoricoPagado)}</strong> pagado a todo el equipo desde su inicio (salarios acumulados + comisiones reales).
            </div>
            <div className="ibox" style={{ marginTop: 8 }}>
              Comisiones reales registradas hasta ahora: <strong>{fmt(totalComisionesPagadas)}</strong>
            </div>
          </div>

          <MeetingsList />
        </div>

        <div>
          <JobsList />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div className="ctitle" style={{ margin: 0 }}>
            👥 Equipo <span style={{ marginLeft: 6, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--accent2)' }}>{state.employees.length}</span>
          </div>
          <button onClick={addEmployee} className="addbtn" style={{ width: 'auto', padding: '5px 14px', marginLeft: 'auto', fontSize: 11 }}>+ Añadir miembro del equipo</button>
        </div>

        {state.employees.length === 0 && (
          <div className="ibox" style={{ textAlign: 'center', padding: 20 }}>Sin miembros del equipo todavía. Añade el primero.</div>
        )}

        {state.employees.map((e) => (
          <EmployeeCard key={e.id} employee={e} />
        ))}
      </div>
    </div>
  );
}
