import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import TypeDashboard from './pages/TypeDashboard';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import CodePoolManager from './components/CodePoolManager';
import EmailTemplateEditor from './components/EmailTemplateEditor';
import TypeSettings from './components/TypeSettings';
import UserManagement from './components/UserManagement';

function RedirectToFirstType() {
  const { accessibleTypes, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink-50)', fontSize: '14px' }}>
        Carregant…
      </div>
    );
  }

  if (accessibleTypes.length === 0) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${accessibleTypes[0]}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect root to first accessible type */}
            <Route path="/" element={<RedirectToFirstType />} />

            {/* Type-specific routes */}
            <Route
              path="/:type"
              element={
                <ProtectedRoute requireType>
                  <TypeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:type/codes"
              element={
                <ProtectedRoute requireType>
                  <CodePoolManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:type/templates"
              element={
                <ProtectedRoute requireType>
                  <EmailTemplateEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:type/settings"
              element={
                <ProtectedRoute requireType>
                  <TypeSettings />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
