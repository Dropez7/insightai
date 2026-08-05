// ============================================================
// RegisterPage.jsx
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <span className="eyebrow">começar</span>
      <h2 className="auth-title">Criar sua conta</h2>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>
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
            placeholder="mínimo 6 caracteres"
          />
        </div>

        <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Criar conta'}
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="auth-switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
