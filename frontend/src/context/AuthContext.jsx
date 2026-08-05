// ============================================================
// AuthContext.jsx
//
// Guarda "quem está logado" em um Context do React, disponível para
// qualquer componente da árvore via useAuth(). Como o backend ainda
// não emite JWT (isso é planejado para a Versão 5 - IAM), a "sessão"
// aqui é simplificada: guardamos o usuário retornado pelo login no
// localStorage, só para sobreviver a um F5 da página. Isso NÃO é
// autenticação segura — é o suficiente para esta fase de aprendizado,
// e o comentário fica aqui de propósito para não esquecermos disso
// quando chegar a hora de trocar por tokens de verdade.
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'insightai:user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar a aplicação, tenta recuperar a sessão salva localmente.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  function persist(userData) {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }

  async function login(email, password) {
    const userData = await api.users.login({ email, password });
    persist(userData);
    return userData;
  }

  async function register(name, email, password) {
    await api.users.register({ name, email, password });
    // Após cadastrar, já autentica automaticamente — evita pedir
    // pra pessoa digitar a senha duas vezes em telas separadas.
    return login(email, password);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>');
  return ctx;
}
