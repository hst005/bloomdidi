import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api, configureAdminApi } from './lib/api';
import { AppRoutes } from './App';
import { LoginPage } from './pages/LoginPage';
import './index.css';

function Root() {
  const [authed, setAuthed] = useState(!!api.token);
  const [checking, setChecking] = useState(!!api.token);

  useEffect(() => {
    configureAdminApi({ onUnauthorized: () => setAuthed(false) });
  }, []);

  useEffect(() => {
    if (!api.token) {
      setChecking(false);
      setAuthed(false);
      return;
    }
    setChecking(true);
    api
      .fetch('/admin/dashboard')
      .then(() => setAuthed(true))
      .catch(() => {
        api.setToken(null);
        setAuthed(false);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.fetch<{ accessToken: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    api.setToken(res.accessToken);
    setAuthed(true);
  };

  if (checking) {
    return (
      <div
        className="bd-ambient"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--bd-ink-soft)',
        }}
      >
        Checking session…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authed ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={login} />
            )
          }
        />
        <Route
          path="/*"
          element={authed ? <AppRoutes /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
