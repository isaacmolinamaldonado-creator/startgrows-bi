import { AppState, MktClient, FinClient, Canal, Employee, HistorialEntry } from './types';

// ============================================================
// FORMATEO
// ============================================================
export function fmt(v: number | string, d = 0): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '€0';
  return '€' + n.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function fmtS(v: number): string {
  if (isNaN(v)) return '€0';
  return (v >= 0 ? '+' : '') + fmt(v);
}

export function colorClass(v: number): string {
  return v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-400';
}

export function margen(ben: number, ing: number): string {
  if (!ing || ing === 0) return '—';
  return ((ben / ing) * 100).toFixed(1) + '%';
}

export function getMonthStr(month: number, year: number, MONTHS: string[]): string {
  return MONTHS[month] + ' ' + year;
}

// Mes/año siguiente al dado, con el rollover de diciembre a enero.
export function nextMonthYear(month: number, year: number): { month: number; year: number } {
  let m = month + 1;
  let y = year;
  if (m > 11) { m = 0; y += 1; }
  return { month: m, year: y };
}

// Meses de diferencia entre el mes/año real (calendario del dispositivo) y el mes/año
// que el sistema tiene como "actual" (state.curMonth/curYear, que solo avanza cuando
// se cierra el mes Financiero a mano). Positivo = el sistema quedó atrasado.
export function monthDrift(state: AppState): number {
  const now = new Date();
  return (now.getFullYear() - state.curYear) * 12 + (now.getMonth() - state.curMonth);
}

// ============================================================
// HISTORIAL — resumen, comparativas mes a mes
// ============================================================
export interface HistorialComparativa {
  actual: HistorialEntry;
  anterior: HistorialEntry | null;
  deltaPct: number | null;
}

export interface HistorialResumen {
  totalFacturado: number;
  totalBeneficio: number;
  entradas: number;
  promedioFacturado: number;
  promedioBeneficio: number;
  porTipo: {
    mkt: { facturado: number; beneficio: number; n: number };
    fin: { facturado: number; beneficio: number; n: number };
  };
  comparativaMkt: HistorialComparativa | null;
  comparativaFin: HistorialComparativa | null;
  mejorMes: HistorialEntry | null;
  peorMes: HistorialEntry | null;
}

function lastTwoByType(historial: HistorialEntry[], type: 'mkt' | 'fin'): HistorialComparativa | null {
  // state.historial viene del más reciente al más antiguo (cada cierre se inserta al inicio)
  const filtered = historial.filter((e) => e.type === type);
  if (filtered.length === 0) return null;
  const actual = filtered[0];
  const anterior = filtered[1] || null;
  const deltaPct = anterior && anterior.ben !== 0 ? ((actual.ben - anterior.ben) / Math.abs(anterior.ben)) * 100 : null;
  return { actual, anterior, deltaPct };
}

export function historialResumen(state: AppState): HistorialResumen {
  const h = state.historial;
  const totalFacturado = h.reduce((s, e) => s + (e.facturado || 0), 0);
  const totalBeneficio = h.reduce((s, e) => s + (e.ben || 0), 0);
  const entradas = h.length;

  const sumaPorTipo = (type: 'mkt' | 'fin') => h.filter((e) => e.type === type).reduce(
    (acc, e) => ({ facturado: acc.facturado + (e.facturado || 0), beneficio: acc.beneficio + (e.ben || 0), n: acc.n + 1 }),
    { facturado: 0, beneficio: 0, n: 0 },
  );

  let mejorMes: HistorialEntry | null = null;
  let peorMes: HistorialEntry | null = null;
  h.forEach((e) => {
    if (!mejorMes || e.ben > mejorMes.ben) mejorMes = e;
    if (!peorMes || e.ben < peorMes.ben) peorMes = e;
  });

  return {
    totalFacturado,
    totalBeneficio,
    entradas,
    promedioFacturado: entradas ? totalFacturado / entradas : 0,
    promedioBeneficio: entradas ? totalBeneficio / entradas : 0,
    porTipo: { mkt: sumaPorTipo('mkt'), fin: sumaPorTipo('fin') },
    comparativaMkt: lastTwoByType(h, 'mkt'),
    comparativaFin: lastTwoByType(h, 'fin'),
    mejorMes,
    peorMes,
  };
}

// ============================================================
// CANALES
// ============================================================
export function getCanalById(canals: Canal[], id: number): Canal {
  return canals.find((c) => c.id === id) || canals[0];
}

// ============================================================
// MARKETING
// ============================================================
export function mktFixedTotal(state: AppState): number {
  return state.mkt_fixed.filter((x) => x.active).reduce((s, x) => s + x.amount, 0);
}

export function mktVarTotal(state: AppState): number {
  return state.mkt_var.filter((x) => x.active).reduce((s, x) => s + x.amount, 0);
}

export function mktSetterCost(canal: string): number {
  if (canal === 'inbound') return 40;
  if (canal === 'outbound') return 85;
  return 0;
}

export interface MktClientCalc {
  tp: number;
  varC: number;
  setter: number;
  cost: number;
  ben: number;
  pct: number;
}

export function mktClientCalc(state: AppState, cl: MktClient): MktClientCalc {
  const pct = (cl.pct || state.globalInputs.mktPct) / 100;
  const tp = cl.ticket * pct;
  const varC = mktVarTotal(state) + (cl.varExtra || 0);
  const setter = mktSetterCost(cl.canal);
  const cost = varC + setter;
  return { tp, varC, setter, cost, ben: tp - cost, pct: pct * 100 };
}

export interface MktTotals {
  fixed: number;
  totalTp: number;
  totalVar: number;
  totalSetter: number;
  totalCost: number;
  ben: number;
  n: number;
}

export function mktTotals(state: AppState): MktTotals {
  const fixed = mktFixedTotal(state);
  let totalTp = 0, totalVar = 0, totalSetter = 0;
  state.mkt_clients.forEach((cl) => {
    const c = mktClientCalc(state, cl);
    totalTp += c.tp;
    totalVar += c.varC;
    totalSetter += c.setter;
  });
  const totalCost = fixed + totalVar + totalSetter;
  return { fixed, totalTp, totalVar, totalSetter, totalCost, ben: totalTp - totalCost, n: state.mkt_clients.length };
}

// ============================================================
// FINANCIERO
// ============================================================
export function finFixedTotal(state: AppState): number {
  return state.fin_fixed.filter((x) => x.active).reduce((s, x) => s + x.amount, 0);
}

export interface FinClientCalc {
  tickEur: number;
  comm: number;
  closer: number;
  varC: number;
  ben: number;
}

export function finClientCalc(state: AppState, cl: FinClient): FinClientCalc {
  const fx = state.globalInputs.gfx;
  const tickEur = cl.ticket_usd * fx;
  const canal = getCanalById(state.canals, cl.canal_id);
  const comm = canal.comm_usd * fx;
  const closer = cl.closer ? state.fin_closer_usd * fx : 0;
  const varC = comm + closer;
  return { tickEur, comm, closer, varC, ben: tickEur - varC };
}

export interface FinTotals {
  fixed: number;
  totalRev: number;
  totalVar: number;
  totalCost: number;
  ben: number;
  n: number;
}

export function finTotals(state: AppState): FinTotals {
  const fixed = finFixedTotal(state);
  let totalRev = 0, totalVar = 0;
  state.fin_clients.forEach((cl) => {
    const c = finClientCalc(state, cl);
    totalRev += c.tickEur;
    totalVar += c.varC;
  });
  const totalCost = fixed + totalVar;
  return { fixed, totalRev, totalVar, totalCost, ben: totalRev - totalCost, n: state.fin_clients.length };
}

// ============================================================
// PERSONAL — empleados, comisiones, producción
// ============================================================
export function empInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export function empMonthlySalary(e: Employee): number {
  return (e.fixedSalary || 0) + (e.bonus || 0);
}

export function empMonthsActive(e: Employee): number {
  if (!e.startDate) return 0;
  const start = new Date(e.startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

// Comisiones totales pagadas a un empleado (histórico completo)
export function empCommissionsTotal(state: AppState, employeeId: number): number {
  return state.commissions
    .filter((c) => c.employeeId === employeeId)
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);
}

// Comisiones pagadas a un empleado en el mes/año actual
export function empCommissionsThisMonth(state: AppState, employeeId: number): number {
  return state.commissions
    .filter((c) => {
      if (c.employeeId !== employeeId) return false;
      const d = new Date(c.date);
      return d.getMonth() === state.curMonth && d.getFullYear() === state.curYear;
    })
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);
}

// Número de comisiones (≈ clientes) registradas a un empleado en el mes/año actual —
// se usa como proxy de "clientes cerrados este mes" para la escalera de compensación,
// porque los clientes en sí (MktClient/FinClient) no llevan fecha propia de cierre.
export function empCommissionCountThisMonth(state: AppState, employeeId: number): number {
  return state.commissions.filter((c) => {
    if (c.employeeId !== employeeId) return false;
    const d = new Date(c.date);
    return d.getMonth() === state.curMonth && d.getFullYear() === state.curYear;
  }).length;
}

// Mismo conteo que arriba, pero separado por tipo de cliente (Marketing vs Financiero) —
// para saber no solo cuántos clientes trajo este mes, sino de qué servicio.
export function empCommissionCountThisMonthByType(state: AppState, employeeId: number): { mkt: number; fin: number } {
  const thisMonth = state.commissions.filter((c) => {
    if (c.employeeId !== employeeId) return false;
    const d = new Date(c.date);
    return d.getMonth() === state.curMonth && d.getFullYear() === state.curYear;
  });
  return {
    mkt: thisMonth.filter((c) => c.type === 'mkt').length,
    fin: thisMonth.filter((c) => c.type === 'fin').length,
  };
}

// Escalera de compensación de StartGrows: comisión desde el día 1, fijo solo si se
// sostiene el resultado. Ver 05_EQUIPO/Estructura_de_Compensacion en el vault.
export function empLadderTier(clientsThisMonth: number, monthsSustained: number): { label: string; suggestedFixed: number } {
  if (clientsThisMonth < 3) return { label: 'Solo comisión — sin fijo todavía', suggestedFixed: 0 };
  if (monthsSustained < 2) return { label: 'Fijo nivel 1 — recién activado', suggestedFixed: 75 };
  return { label: 'Fijo nivel 2 — resultado sostenido', suggestedFixed: 150 };
}

// Total pagado a un empleado (salarios acumulados estimados + comisiones reales)
export function empTotalPaidLifetime(state: AppState, e: Employee): number {
  const monthsActive = empMonthsActive(e);
  const estimatedSalary = empMonthlySalary(e) * monthsActive;
  const commissions = empCommissionsTotal(state, e.id);
  return estimatedSalary + commissions;
}

// Cuántos clientes ha cerrado un empleado (marketing + financiero, vía comisiones vinculadas o campo closedByEmployeeId)
export function empClientsClosedCount(state: AppState, employeeId: number): { mkt: number; fin: number; total: number } {
  const mkt = state.mkt_clients.filter((c) => c.closedByEmployeeId === employeeId).length;
  const fin = state.fin_clients.filter((c) => c.closedByEmployeeId === employeeId).length;
  return { mkt, fin, total: mkt + fin };
}

// Cuánto ha generado (en ingresos para la empresa) un empleado, a través de los clientes que cerró
export function empRevenueGenerated(state: AppState, employeeId: number): number {
  let total = 0;
  state.mkt_clients
    .filter((c) => c.closedByEmployeeId === employeeId)
    .forEach((c) => {
      total += mktClientCalc(state, c).tp;
    });
  state.fin_clients
    .filter((c) => c.closedByEmployeeId === employeeId)
    .forEach((c) => {
      total += finClientCalc(state, c).tickEur;
    });
  return total;
}

// ROI del empleado: cuánto genera vs cuánto cuesta (salario + comisiones)
export function empROI(state: AppState, e: Employee): { generated: number; cost: number; net: number; ratio: number } {
  const generated = empRevenueGenerated(state, e.id);
  const monthsActive = Math.max(1, empMonthsActive(e));
  const cost = empMonthlySalary(e) * monthsActive + empCommissionsTotal(state, e.id);
  const net = generated - cost;
  const ratio = cost > 0 ? generated / cost : 0;
  return { generated, cost, net, ratio };
}

// ============================================================
// COMISIONES — crear / calcular
// ============================================================
export function calcCommissionAmount(baseAmount: number, pct: number): number {
  return baseAmount * (pct / 100);
}
