// ============================================================
// TIPOS CENTRALES — StartGrows Business Intelligence
// ============================================================

export type MktCanal = 'ninguno' | 'inbound' | 'outbound';

export interface CostItem {
  id: number;
  name: string;
  amount: number;
  active: boolean;
}

export interface Canal {
  id: number;
  key: string;
  label: string;
  comm_usd: number;
  active: boolean;
}

export interface MktClient {
  id: number;
  name: string;
  ticket: number;
  pct: number;
  canal: MktCanal;
  varExtra: number;
  months: number;
  closedByEmployeeId?: number | null;
}

export interface FinClient {
  id: number;
  name: string;
  ticket_usd: number;
  canal_id: number;
  closer: boolean;
  closedByEmployeeId?: number | null;
}

// Comisión que se le paga a un empleado por haber cerrado un cliente concreto.
// Puede estar vinculada a un cliente real (mktClientId / finClientId) o ser
// un registro manual (clientLabel libre, sin vínculo).
export interface Commission {
  id: number;
  employeeId: number;
  type: 'mkt' | 'fin' | 'manual';
  mktClientId?: number | null;
  finClientId?: number | null;
  clientLabel: string;        // nombre mostrado, autollenado si está vinculado
  amount: number;             // importe base sobre el que se calcula (€)
  pct: number;                // % de comisión aplicado
  commissionAmount: number;   // importe final pagado (calculado o manual)
  date: string;               // ISO date
  note?: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  country: string;
  phone: string;
  email: string;
  fixedSalary: number;
  bonus: number;
  startDate: string;
  workload: number; // 0-150 %
  active: boolean;
}

export interface Job {
  id: number;
  title: string;
  status: 'open' | 'closed';
  salaryRange: string;
  description: string;
  createdAt: string;
}

export interface Meeting {
  id: number;
  title: string;
  day: string;
  time: string;
  notes: string;
}

export interface HistorialEntry {
  mes: string;
  month: number;
  year: number;
  type: 'mkt' | 'fin';
  rev: number;
  cost: number;
  ben: number;
  n: number;
  facturado: number;
  gastos: number;
  clients: (MktClient | FinClient)[];
}

export interface GlobalInputs {
  gfx: number;
  mktPct: number;
  finDefTicket: number;
  finCloserUsd: number;
}

export interface AppState {
  mkt_fixed: CostItem[];
  mkt_var: CostItem[];
  mkt_clients: MktClient[];
  fin_fixed: CostItem[];
  canals: Canal[];
  fin_closer_usd: number;
  fin_def_ticket: number;
  fin_clients: FinClient[];
  historial: HistorialEntry[];
  mkt_historial: HistorialEntry[];

  roles: string[];
  employees: Employee[];
  jobs: Job[];
  meetings: Meeting[];
  commissions: Commission[];

  curMonth: number;
  curYear: number;
  globalInputs: GlobalInputs;

  nextMktId: number;
  nextFinId: number;
  nextCanalId: number;
  nextEmpId: number;
  nextJobId: number;
  nextMeetingId: number;
  nextCommissionId: number;
}

export type SaveStatus = 'idle' | 'saving' | 'ok' | 'error';
