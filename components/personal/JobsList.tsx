'use client';

import { useAppStore } from '@/store/useAppStore';
import { Job } from '@/lib/types';

export default function JobsList() {
  const { state, setState } = useAppStore();

  function updateJob(id: number, patch: Partial<Job>) {
    setState((prev) => ({ ...prev, jobs: prev.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  }
  function addJob() {
    setState((prev) => ({
      ...prev,
      jobs: [...prev.jobs, { id: prev.nextJobId, title: 'Nuevo puesto', status: 'open', salaryRange: '', description: '', createdAt: new Date().toISOString().slice(0, 10) }],
      nextJobId: prev.nextJobId + 1,
    }));
  }
  function removeJob(id: number) {
    if (!confirm('¿Eliminar este puesto?')) return;
    setState((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }));
  }
  function toggleStatus(id: number) {
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => (j.id === id ? { ...j, status: j.status === 'open' ? 'closed' : 'open' } : j)),
    }));
  }

  const openCount = state.jobs.filter((j) => j.status === 'open').length;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 13 }}>
        <div className="ctitle" style={{ margin: 0 }}>
          💼 Puestos de trabajo &amp; vacantes <span style={{ marginLeft: 6, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--accent2)' }}>{openCount} abiertas</span>
        </div>
        <button onClick={addJob} className="addbtn" style={{ width: 'auto', padding: '4px 12px', marginLeft: 'auto', fontSize: 11 }}>+ Crear puesto/vacante</button>
      </div>

      {state.jobs.length === 0 && <div className="ibox" style={{ textAlign: 'center', padding: 16 }}>Sin puestos creados.</div>}

      {state.jobs.map((j) => (
        <div key={j.id} className="job-card">
          <div className="job-head">
            <input className="inp-name" style={{ flex: 1 }} value={j.title} onChange={(e) => updateJob(j.id, { title: e.target.value })} />
            <span
              className={`job-status ${j.status === 'open' ? 'job-open' : 'job-closed'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleStatus(j.id)}
            >
              {j.status === 'open' ? 'Vacante abierta' : 'Cerrada'}
            </span>
            <button className="rm-btn" onClick={() => removeJob(j.id)}>✕</button>
          </div>
          <div className="cfield" style={{ marginBottom: 6 }}>
            <label>Rango salarial</label>
            <input className="inp" value={j.salaryRange || ''} placeholder="ej: 400-700€/mes" onChange={(e) => updateJob(j.id, { salaryRange: e.target.value })} />
          </div>
          <div className="cfield">
            <label>Descripción del puesto</label>
            <textarea
              className="inp" rows={2} style={{ resize: 'vertical', fontFamily: 'var(--font-inter)' }}
              value={j.description || ''}
              onChange={(e) => updateJob(j.id, { description: e.target.value })}
            />
          </div>
        </div>
      ))}

      <div className="sep"></div>
      <div className="ibox">
        <strong>{state.jobs.length} puesto(s)</strong> registrados — {openCount} vacante(s) abierta(s) actualmente buscando candidato.
      </div>
    </div>
  );
}
