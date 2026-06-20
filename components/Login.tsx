'use client';

import { useState, KeyboardEvent } from 'react';

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');

  const correctPwd = process.env.NEXT_PUBLIC_APP_PASSWORD || '';

  function handleLogin() {
    if (pwd === correctPwd) {
      onSuccess();
    } else {
      setError('Contraseña incorrecta');
      setTimeout(() => setError(''), 2500);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleLogin();
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🚀</div>
        <div className="login-title">StartGrows</div>
        <div className="login-sub">Business Intelligence · Acceso privado</div>
        <input
          className="login-input"
          type="password"
          placeholder="••••••••••"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="login-err">{error}</div>
        <button className="login-btn" onClick={handleLogin}>
          Acceder →
        </button>
      </div>
    </div>
  );
}
