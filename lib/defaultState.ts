import { AppState } from './types';

export const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const COUNTRIES = ['España', 'México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Venezuela', 'Ecuador', 'Estados Unidos', 'Otro'];
export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function getDefaultState(): AppState {
  const now = new Date();
  return {
    mkt_fixed: [
      { id: 1, name: 'Pauta Meta diaria', amount: 150, active: true },
      { id: 2, name: 'GoHighLevel plan', amount: 51, active: true },
    ],
    mkt_var: [
      { id: 1, name: 'Dashboard profesional', amount: 130, active: true },
      { id: 2, name: 'GoHighLevel cliente', amount: 51, active: true },
    ],
    mkt_clients: [
      { id: 1, name: 'Cliente 1', ticket: 900, pct: 65, canal: 'inbound', varExtra: 0, months: 3, closedByEmployeeId: null },
      { id: 2, name: 'Cliente 2', ticket: 1800, pct: 65, canal: 'outbound', varExtra: 0, months: 1, closedByEmployeeId: null },
      { id: 3, name: 'Cliente 3', ticket: 900, pct: 65, canal: 'ninguno', varExtra: 0, months: 2, closedByEmployeeId: null },
    ],
    fin_fixed: [
      { id: 1, name: 'Pauta Meta diaria', amount: 150, active: true },
      { id: 2, name: 'Agencia de llamadas', amount: 300, active: true },
      { id: 3, name: 'Telegram', amount: 5, active: true },
    ],
    canals: [
      { id: 1, key: 'ninguno', label: 'Sin comisión', comm_usd: 0, active: true },
      { id: 2, key: 'inbound', label: 'Setter Inbound', comm_usd: 40, active: true },
      { id: 3, key: 'outbound', label: 'Setter Outbound', comm_usd: 100, active: true },
      { id: 4, key: 'agencia', label: 'Agencia', comm_usd: 100, active: true },
      { id: 5, key: 'meta', label: 'Tráfico Meta', comm_usd: 40, active: true },
      { id: 6, key: 'afiliacion', label: 'Afiliación', comm_usd: 0, active: true },
    ],
    fin_closer_usd: 50,
    fin_def_ticket: 500,
    fin_clients: [
      { id: 1, name: 'Cierre 1', ticket_usd: 500, canal_id: 3, closer: false, closedByEmployeeId: null },
      { id: 2, name: 'Cierre 2', ticket_usd: 500, canal_id: 4, closer: false, closedByEmployeeId: null },
    ],
    historial: [],
    mkt_historial: [],

    roles: ['Setter Inbound', 'Setter Outbound', 'Closer', 'Media Buyer', 'Diseñador', 'Editor de vídeo', 'Customer Success', 'Desarrollador', 'Otro'],
    employees: [],
    jobs: [
      { id: 1, title: 'Setter Outbound', status: 'open', salaryRange: '400-700€/mes + comisión', description: 'Encargado de captación outbound para servicio de marketing y financiero.', createdAt: '' },
    ],
    meetings: [
      { id: 1, title: 'Reunión semanal equipo', day: 'Lunes', time: '10:00', notes: 'Revisión de KPIs y pipeline' },
    ],
    commissions: [],

    curMonth: now.getMonth(),
    curYear: now.getFullYear(),
    globalInputs: {
      gfx: 0.92,
      mktPct: 65,
      finDefTicket: 500,
      finCloserUsd: 50,
    },

    nextMktId: 20,
    nextFinId: 20,
    nextCanalId: 20,
    nextEmpId: 10,
    nextJobId: 10,
    nextMeetingId: 10,
    nextCommissionId: 10,
  };
}
