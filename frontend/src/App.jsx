// ============================================================
// App.jsx
//
// Define o mapa de rotas da aplicação. As rotas dentro do elemento
// <ProtectedLayout /> só são acessíveis com uma sessão ativa — a
// própria checagem de autenticação está dentro desse componente.
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import ProtectedLayout from './components/ProtectedLayout';
import DatasetPage from './pages/DatasetPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/datasets/:id" element={<DatasetPage />} />
      </Route>

      {/* Qualquer rota desconhecida volta para o início */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
