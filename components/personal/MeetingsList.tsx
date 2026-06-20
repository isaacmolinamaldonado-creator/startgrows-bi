'use client';

import { useAppStore } from '@/store/useAppStore';
import { Meeting } from '@/lib/types';
import { DAYS_ES } from '@/lib/defaultState';

export default function MeetingsList() {
  const { state, setState } = useAppStore();

  function updateMeeting(id: number, patch: Partial<Meeting>) {
    setState((prev) => ({ ...prev, meetings: prev.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }
  function addMeeting() {
    setState((prev) => ({
      ...prev,
      meetings: [...prev.meetings, { id: prev.nextMeetingId, title: 'Nueva reunión', day: 'Lunes', time: '10:00', notes: '' }],
      nextMeetingId: prev.nextMeetingId + 1,
    }));
  }
  function removeMeeting(id: number) {
    setState((prev) => ({ ...prev, meetings: prev.meetings.filter((m) => m.id !== id) }));
  }

  return (
    <div className="card">
      <div className="ctitle">
        🗓 Reuniones recurrentes
        <button className="addbtn" style={{ width: 'auto', padding: '4px 10px', marginLeft: 'auto', fontSize: 10 }} onClick={addMeeting}>+ Añadir</button>
      </div>

      {state.meetings.length === 0 && <div className="ibox" style={{ textAlign: 'center', padding: 16 }}>Sin reuniones programadas.</div>}

      {state.meetings.map((m) => (
        <div key={m.id} className="meeting-row">
          <div className="meeting-day">
            <div className="md-num">{(m.time || '').slice(0, 5) || '--:--'}</div>
            <div className="md-txt">{(m.day || '').slice(0, 3)}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input className="inp-name" value={m.title} onChange={(e) => updateMeeting(m.id, { title: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="sel" style={{ width: 'auto' }} value={m.day} onChange={(e) => updateMeeting(m.id, { day: e.target.value })}>
                {DAYS_ES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" className="inp" style={{ width: 90 }} value={m.time || '10:00'} onChange={(e) => updateMeeting(m.id, { time: e.target.value })} />
            </div>
            <input
              className="inp" placeholder="Notas (opcional)" value={m.notes || ''}
              onChange={(e) => updateMeeting(m.id, { notes: e.target.value })}
              style={{ fontSize: 10 }}
            />
          </div>
          <button className="rm-btn" onClick={() => removeMeeting(m.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
