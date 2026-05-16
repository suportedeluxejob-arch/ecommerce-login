import { useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // onAuthStateChanged in context will update user → redirect happens automatically
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else if (code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError('Erro ao entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="login-shape shape-1" />
        <div className="login-shape shape-2" />
        <div className="login-shape shape-3" />
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon-wrap">
            <ShieldCheck size={32} strokeWidth={1.8} />
          </div>
          <h1 className="login-title">Painel Admin</h1>
          <p className="login-subtitle">Acesso restrito — faça login para continuar</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="admin-email">E-mail</label>
            <div className="login-input-wrap">
              <Mail size={18} className="login-input-icon" />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@sualojaloja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="admin-password">Senha</label>
            <div className="login-input-wrap">
              <Lock size={18} className="login-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading || !email || !password}>
            {loading ? (
              <><span className="login-spinner" /> Entrando...</>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <p className="login-footer-note">
          🔒 Conexão segura via Firebase Authentication
        </p>
      </div>
    </div>
  );
}
