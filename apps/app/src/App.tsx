import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/routes/RequireAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulePlaceholder } from '@/pages/ModulePlaceholder';
import { EmployesListPage } from '@/features/rh/EmployesListPage';
import { EmployeFormPage } from '@/features/rh/EmployeFormPage';
import { EmployeDetailPage } from '@/features/rh/EmployeDetailPage';
import { PresencesPage } from '@/features/presences/PresencesPage';
import { CongeFormPage } from '@/features/presences/CongeFormPage';
import { RapportsPage } from '@/features/rapports/RapportsPage';
import { RapportFormPage } from '@/features/rapports/RapportFormPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="rh" element={<EmployesListPage />} />
            <Route path="rh/nouveau" element={<EmployeFormPage />} />
            <Route path="rh/:id" element={<EmployeDetailPage />} />
            <Route path="rh/:id/editer" element={<EmployeFormPage />} />
            <Route
              path="documents"
              element={<ModulePlaceholder title="Documents & Contrats" />}
            />
            <Route path="presences" element={<PresencesPage />} />
            <Route path="presences/conges/nouveau" element={<CongeFormPage />} />
            <Route path="rapports" element={<RapportsPage />} />
            <Route path="rapports/nouveau" element={<RapportFormPage />} />
            <Route path="alertes" element={<ModulePlaceholder title="Alertes" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
