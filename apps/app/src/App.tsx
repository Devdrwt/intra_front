import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/routes/RequireAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SetPasswordPage } from '@/pages/SetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmployesListPage } from '@/features/rh/EmployesListPage';
import { EmployeFormPage } from '@/features/rh/EmployeFormPage';
import { EmployeDetailPage } from '@/features/rh/EmployeDetailPage';
import { PresencesPage } from '@/features/presences/PresencesPage';
import { CongeFormPage } from '@/features/presences/CongeFormPage';
import { RapportsPage } from '@/features/rapports/RapportsPage';
import { RapportFormPage } from '@/features/rapports/RapportFormPage';
import { AlertesPage } from '@/features/espaces/AlertesPage';
import { RecrutementPage } from '@/features/recrutement/RecrutementPage';
import { UsersPage } from '@/features/users/UsersPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { GuidePage } from '@/pages/GuidePage';
import { FaqPage } from '@/pages/FaqPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
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
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="presences" element={<PresencesPage />} />
            <Route path="presences/conges/nouveau" element={<CongeFormPage />} />
            <Route path="rapports" element={<RapportsPage />} />
            <Route path="rapports/nouveau" element={<RapportFormPage />} />
            <Route path="recrutement" element={<RecrutementPage />} />
            <Route path="utilisateurs" element={<UsersPage />} />
            <Route path="alertes" element={<AlertesPage />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="parametres" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
