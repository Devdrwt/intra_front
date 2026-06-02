import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/routes/RequireAuth';
import { RequirePermission } from '@/routes/RequirePermission';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SetPasswordPage } from '@/pages/SetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SelfServicePlaceholder } from '@/pages/SelfServicePlaceholder';
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
            {/* --- Mon espace (tout utilisateur connecté) ------------------- */}
            <Route index element={<DashboardPage />} />
            <Route
              path="mon-pointage"
              element={
                <SelfServicePlaceholder
                  title="Mon pointage"
                  description="Pointez vos arrivées / départs et consultez votre historique de présence."
                />
              }
            />
            <Route
              path="mes-conges"
              element={
                <SelfServicePlaceholder
                  title="Mes congés"
                  description="Déposez vos demandes de congé et suivez leur statut."
                />
              }
            />
            <Route
              path="mes-rapports"
              element={
                <SelfServicePlaceholder
                  title="Mes rapports"
                  description="Rédigez et envoyez vos rapports journaliers."
                />
              }
            />
            <Route
              path="mes-documents"
              element={
                <SelfServicePlaceholder
                  title="Mes documents"
                  description="Retrouvez vos bulletins, contrats et attestations."
                />
              }
            />
            <Route path="alertes" element={<AlertesPage />} />

            {/* --- Aide & réglages (transverse) ----------------------------- */}
            <Route path="guide" element={<GuidePage />} />
            <Route path="faq" element={<FaqPage />} />

            {/* --- Administration (gardée par permission) ------------------- */}
            <Route element={<RequirePermission perm="rh.employe:read" />}>
              <Route path="rh" element={<EmployesListPage />} />
              <Route path="rh/nouveau" element={<EmployeFormPage />} />
              <Route path="rh/:id" element={<EmployeDetailPage />} />
              <Route path="rh/:id/editer" element={<EmployeFormPage />} />
              <Route path="documents" element={<DocumentsPage />} />
            </Route>

            <Route element={<RequirePermission perm="presence:manage" />}>
              <Route path="presences" element={<PresencesPage />} />
              <Route path="presences/conges/nouveau" element={<CongeFormPage />} />
            </Route>

            <Route element={<RequirePermission perm="rapport:manage" />}>
              <Route path="rapports" element={<RapportsPage />} />
              <Route path="rapports/nouveau" element={<RapportFormPage />} />
            </Route>

            <Route element={<RequirePermission perm="recrutement:read" />}>
              <Route path="recrutement" element={<RecrutementPage />} />
            </Route>

            <Route element={<RequirePermission perm="user:read" />}>
              <Route path="utilisateurs" element={<UsersPage />} />
            </Route>

            <Route element={<RequirePermission perm="settings:manage" />}>
              <Route path="parametres" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
