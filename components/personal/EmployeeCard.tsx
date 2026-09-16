'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Employee, Commission } from '@/lib/types';
import {
  fmt, fmtS, colorClass, empInitials, empMonthlySalary, empMonthsActive,
  empCommissionsTotal, empCommissionsThisMonth, empTotalPaidLifetime, empClientsClosedCount, empRevenueGenerated, empROI,
  empCommissionCountThisMonth, empCommissionCountThisMonthByType, empLadderTier,
} from '@/lib/calculations';
import { COUNTRIES } from '@/lib/defaultState';
import CommissionModal from './CommissionModal';

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const { state, setState } = useAppStore();
  const [showCommModal, setShowCommModal] = useState(false);
  const [showCommHistory, setShowCommHistory] = useState(false);

  function updateEmployee(patch: Partial<Employee>) {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === employee.id ? { ...e, ...patch } : e)),
    }));
  }

  function removeEmployee() {
    if (!confirm('¿Eliminar este miembro del equipo? Las comisiones registradas se mantendrán en el histórico.')) return;
    setState((prev) => ({ ...prev, employees: prev.employees.filter((e) => e.id !== employee.id) }));
  }

  function removeCommission(commId: number) {
    if (!confirm('¿Eliminar este registro de comisión?')) return;
    setState((prev) => ({ ...prev, commissions: prev.commissions.filter((c) => c.id !== commId) }));
  }

  const monthly = empMonthlySalary(employee);
  const monthsActive = empMonthsActive(employee);
  const lifetime = empTotalPaidLifetime(state, employee);
  const workload = employee.workload || 0;
  const overloaded = workload >= 85;

  const commissionsTotal = empCommissionsTotal(state, employee.id);
  const empCommissions: Commission[] = state.commissions
    .filter((c) => c.employeeId === employee.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clientsCount = empClientsClosedCount(state, employee.id);
  const revenueGenerated = empRevenueGenerated(state, employee.id);
  const roi = empROI(state, employee);

  const clientsThisMonth = empCommissionCountThisMonth(state, employee.id);
  const clientsThisMonthByType = empCommissionCountThisMonthByType(state, employee.id);
  const monthsSustained = employee.monthsSustained || 0;
  const tier = empLadderTier(clientsThisMonth, monthsSustained);
  const suggestionDiffers = tier.suggestedFixed !== (employee.fixedSalary || 0);
  const empCommissionsThisMonthAmt = empCommissionsThisMonth(state, employee.id);

  return (
    <div className="emp-card">
      <div className="emp-head">
        <div className="emp-avatar">{empInitials(employee.name)}</div>
        <div className="emp-name-role">
          <input
            className="inp-name" style={{ fontSize: 15 }}
            value={employee.name}
            placeholder="Nombre del empleado"
            onChange={(e) => updateEmployee({ name: e.target.value })}
          />
          <div className="emp-role">{employee.role}</div>
        </div>
        <span className={`emp-tenure-badge ${employee.active ? 'emp-status-active' : ''}`}>{employee.active ? 'Activo' : 'Inactivo'}</span>
        {overloaded && <span className="emp-tenure-badge emp-status-overload">⚠ Saturado</span>}
        <span className="emp-tenure-badge">{monthsActive} {monthsActive === 1 ? 'mes' : 'meses'}</span>
        <button className="rm-btn" onClick={removeEmployee}>✕</button>
      </div>

      <div className="emp-grid">
        <div className="emp-field">
          <label>Cargo / puesto</label>
          <select className="sel" value={employee.role} onChange={(e) => updateEmployee({ role: e.target.value })}>
            {state.roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="emp-field">
          <label>País</label>
          <select className="sel" value={employee.country} onChange={(e) => updateEmployee({ country: e.target.value })}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="emp-field">
          <label>Teléfono</label>
          <input className="inp" value={employee.phone || ''} placeholder="+34 600 000 000" onChange={(e) => updateEmployee({ phone: e.target.value })} />
        </div>
        <div className="emp-field">
          <label>Correo</label>
          <input className="inp" value={employee.email || ''} placeholder="correo@ejemplo.com" onChange={(e) => updateEmployee({ email: e.target.value })} />
        </div>
        <div className="emp-field">
          <label>Salario fijo mensual (€)</label>
          <input type="number" className="inp" min={0} value={employee.fixedSalary || 0} onChange={(e) => updateEmployee({ fixedSalary: +e.target.value })} />
        </div>
        <div className="emp-field">
          <label>Bonus este mes (€)</label>
          <input type="number" className="inp" min={0} value={employee.bonus || 0} onChange={(e) => updateEmployee({ bonus: +e.target.value })} />
        </div>
        <div className="emp-field">
          <label>Fecha de inicio</label>
          <input type="date" className="inp" value={employee.startDate || ''} onChange={(e) => updateEmployee({ startDate: e.target.value })} />
        </div>
        <div className="emp-field">
          <label>Carga de trabajo (%)</label>
          <input type="number" className="inp" min={0} max={150} value={workload} onChange={(e) => updateEmployee({ workload: +e.target.value })} />
        </div>
        <div className="emp-field full">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className={`tog ${employee.active ? 'on' : ''}`} onClick={() => updateEmployee({ active: !employee.active })}></button>
            <label style={{ fontSize: 11, color: 'var(--muted2)' }}>Activo en el equipo</label>
          </div>
        </div>
        <div className="emp-field full">
          <label>Qué va a hacer esta persona</label>
          <textarea
            className="roledesc-textarea"
            value={employee.roleDescription || ''}
            placeholder="Ej: prospección en frío, agenda sesiones, deja nota en GHL tras cada llamada..."
            onChange={(e) => updateEmployee({ roleDescription: e.target.value })}
          />
        </div>
      </div>

      <div className="ladderbox" style={{ marginBottom: 12 }}>
        <div className="ladderrow">
          <span>Clientes cerrados este mes</span>
          <span className="cur">{clientsThisMonth} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({clientsThisMonthByType.mkt} Mkt · {clientsThisMonthByType.fin} Fin)</span></span>
        </div>
        <div className="ladderrow">
          <span>Meses consecutivos sosteniendo 3-4+ clientes</span>
          <input
            type="number" min={0} className="cur"
            style={{ background: 'transparent', border: 'none', width: 40, textAlign: 'right', color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600 }}
            value={monthsSustained}
            onChange={(e) => updateEmployee({ monthsSustained: +e.target.value })}
          />
        </div>
        <div className="ladderrow"><span>Comisión acumulada este mes</span><span className="cur">{fmt(empCommissionsThisMonthAmt)}</span></div>
        <div className="ladderrow">
          <span>Generado vs. pagado (histórico)</span>
          <span className="cur">{fmt(roi.generated)} / {fmt(roi.cost)} <span className={colorClass(roi.net)}>→ {roi.ratio.toFixed(2)}x</span></span>
        </div>
        <div className="suggestbar">
          <div className="suggesttext">La escalera sugiere: <span className="tier">{tier.label}</span></div>
          <button
            className={`applybtn ${!suggestionDiffers ? 'applied' : ''}`}
            disabled={!suggestionDiffers}
            onClick={() => updateEmployee({ fixedSalary: tier.suggestedFixed })}
          >
            {suggestionDiffers ? `Aplicar €${tier.suggestedFixed} al fijo` : 'Ya aplicado'}
          </button>
        </div>
      </div>

      <div className="workload-bar">
        <div className="workload-fill" style={{ width: `${Math.min(100, workload)}%`, background: overloaded ? 'var(--red)' : workload > 60 ? 'var(--amber)' : 'var(--green)' }}></div>
      </div>

      <div className="emp-kpi-strip">
        <div className="emp-kpi"><div className="ev vr">{fmt(monthly)}</div><div className="el">Salario/mes</div></div>
        <div className="emp-kpi"><div className="ev vm">{fmt(monthly * 3)}</div><div className="el">3 meses</div></div>
        <div className="emp-kpi"><div className="ev vm">{fmt(monthly * 6)}</div><div className="el">6 meses</div></div>
        <div className="emp-kpi"><div className="ev vm">{fmt(monthly * 12)}</div><div className="el">1 año</div></div>
        <div className="emp-kpi"><div className="ev vm">{fmt(monthly * 24)}</div><div className="el">2 años</div></div>
        <div className="emp-kpi"><div className="ev vx">{fmt(lifetime)}</div><div className="el">Total histórico</div></div>
      </div>

      {/* PRODUCCIÓN Y COMISIONES */}
      <div className="sep"></div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <div className="ctitle" style={{ margin: 0 }}>📈 Producción y comisiones</div>
        <button
          className="addbtn" style={{ width: 'auto', padding: '4px 10px', fontSize: 10, marginLeft: 'auto' }}
          onClick={() => setShowCommModal(true)}
        >
          + Registrar comisión
        </button>
      </div>

      <div className="emp-kpi-strip" style={{ borderTop: 'none', paddingTop: 0, marginBottom: 10 }}>
        <div className="emp-kpi"><div className="ev vw">{clientsCount.total}</div><div className="el">Clientes cerrados</div></div>
        <div className="emp-kpi"><div className="ev vx">{clientsCount.mkt}</div><div className="el">Marketing</div></div>
        <div className="emp-kpi"><div className="ev vg">{clientsCount.fin}</div><div className="el">Financiero</div></div>
        <div className="emp-kpi"><div className="ev vg">{fmt(revenueGenerated)}</div><div className="el">Generado (mes)</div></div>
        <div className="emp-kpi"><div className="ev vr">{fmt(commissionsTotal)}</div><div className="el">Comisiones pagadas</div></div>
      </div>

      <div className="ibox" style={{ marginBottom: 10 }}>
        <strong>ROI estimado:</strong> ha generado <strong>{fmt(roi.generated)}</strong> frente a un coste de <strong>{fmt(roi.cost)}</strong> (salario + comisiones) →
        {' '}<span className={colorClass(roi.net)}>{fmtS(roi.net)}</span> neto
        {roi.cost > 0 && <> · ratio <strong>{roi.ratio.toFixed(2)}x</strong></>}
      </div>

      {empCommissions.length > 0 && (
        <>
          <button
            className="addbtn" style={{ marginBottom: 8 }}
            onClick={() => setShowCommHistory(!showCommHistory)}
          >
            {showCommHistory ? '▲ Ocultar' : '▼ Ver'} historial de comisiones ({empCommissions.length})
          </button>
          {showCommHistory && (
            <div>
              {empCommissions.map((c) => (
                <div key={c.id} className="comm-row">
                  <span className={`comm-badge ${c.type}`}>{c.type === 'mkt' ? 'MKT' : c.type === 'fin' ? 'FIN' : 'MANUAL'}</span>
                  <span style={{ flex: 1, color: 'var(--muted2)' }}>{c.clientLabel}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>{c.pct}%</span>
                  <span className="vg" style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600 }}>{fmt(c.commissionAmount)}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 9 }}>{new Date(c.date).toLocaleDateString('es-ES')}</span>
                  <button className="rm-btn" onClick={() => removeCommission(c.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCommModal && <CommissionModal employee={employee} onClose={() => setShowCommModal(false)} />}
    </div>
  );
}
