// ============================================================
// LoginPage.jsx
// ============================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Se a pessoa tentou acessar uma rota protegida antes de logar,
      // volta pra ela; senão, cai no dashboard.
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <span className="eyebrow">acessar</span>
      <h2 className="auth-title">Bem-vindo de volta</h2>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="auth-switch">
        Ainda não tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </AuthLayout>
  );
}
