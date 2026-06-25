import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/routes/RequireAuth';
import { RequirePermission } from '@/routes/RequirePermission';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SetPasswordPage } from '@/pages/SetPasswordPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccueilRapidePage } from '@/pages/AccueilRapidePage';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { MonPointagePage } from '@/features/me/MonPointagePage';
import { MesDemandesPage } from '@/features/me/MesDemandesPage';
import { MesRapportsPage } from '@/features/me/MesRapportsPage';
import { MonEspaceRhPage } from '@/features/monrh/MonEspaceRhPage';
import { MesDocumentsPage } from '@/features/me/MesDocumentsPage';
import { MesProjetsPage } from '@/features/me/MesProjetsPage';
import { MesValidationsPage } from '@/features/approvals/MesValidationsPage';
import { SupportPage } from '@/features/support/SupportPage';
import { TicketDetailPage } from '@/features/support/TicketDetailPage';
import { TiersPage } from '@/features/finance-core/TiersPage';
import { ComptabilitePage } from '@/features/finance-core/ComptabilitePage';
import { NotesFraisPage } from '@/features/finance-depenses/NotesFraisPage';
import { AchatsPage } from '@/features/finance-depenses/AchatsPage';
import { FacturesClientPage } from '@/features/finance-recettes/FacturesClientPage';
import { TresoreriePage } from '@/features/finance-tresorerie/TresoreriePage';
import { PaiePage } from '@/features/finance-paie/PaiePage';
import { PilotagePage } from '@/features/finance-pilotage/PilotagePage';
import { EvaluationPage } from '@/features/evaluation/EvaluationPage';
import { PerformancePage } from '@/features/evaluation/PerformancePage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { FormationPage } from '@/features/formation/FormationPage';
import { MesTachesPage } from '@/features/tasks/MesTachesPage';
import { CockpitPage } from '@/features/experience/CockpitPage';
import { AssistantPage } from '@/features/assistant/AssistantPage';
import { ArchivagePage } from '@/features/archivage/ArchivagePage';
import { AppelsOffresPage } from '@/features/appels-offres/AppelsOffresPage';
import { StudioPage } from '@/features/studio/StudioPage';
import { InventairePage } from '@/features/inventaire/InventairePage';
import { RentabiliteProjetsPage } from '@/features/finance-pilotage/RentabiliteProjetsPage';
import { BibliothequePage } from '@/features/bibliotheque/BibliothequePage';
import { DiscussionPage } from '@/features/discussion/DiscussionPage';
import { MailPage } from '@/features/webmail/MailPage';
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
import { AuditPage } from '@/features/audit/AuditPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { ProjectFormPage } from '@/features/projects/ProjectFormPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { MediathequePage } from '@/features/mediatheque/MediathequePage';
import { ActualitesPage } from '@/features/actualites/ActualitesPage';
import { ActualiteDetailPage } from '@/features/actualites/ActualiteDetailPage';
import { AnnuairePage } from '@/features/annuaire/AnnuairePage';
import { DocumentationPage } from '@/features/documentation/DocumentationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { GuidePage } from '@/pages/GuidePage';
import { KbPage } from '@/features/kb/KbPage';
import { FaqPage } from '@/pages/FaqPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
            <Route path="accueil-rapide" element={<AccueilRapidePage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="actualites" element={<ActualitesPage />} />
            <Route path="actualites/:id" element={<ActualiteDetailPage />} />
            <Route path="annuaire" element={<AnnuairePage />} />
            <Route path="base-documentaire" element={<DocumentationPage />} />
            <Route path="mon-pointage" element={<MonPointagePage />} />
            <Route path="mes-demandes" element={<MesDemandesPage />} />
            <Route path="mes-validations" element={<MesValidationsPage />} />
            <Route path="mes-taches" element={<MesTachesPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="bibliotheque" element={<BibliothequePage />} />
            <Route path="mes-rapports" element={<MesRapportsPage />} />
            <Route path="mon-espace-rh" element={<MonEspaceRhPage />} />
            <Route path="mes-documents" element={<MesDocumentsPage />} />
            <Route path="mes-projets" element={<MesProjetsPage />} />
            <Route path="discussion" element={<DiscussionPage />} />
            <Route path="mail" element={<MailPage />} />
            <Route path="alertes" element={<AlertesPage />} />

            {/* --- Aide & réglages (transverse) ----------------------------- */}
            <Route path="parametres" element={<SettingsPage />} />
            <Route path="base-connaissances" element={<KbPage />} />
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

            <Route element={<RequirePermission perm="media:read" />}>
              <Route path="mediatheque" element={<MediathequePage />} />
            </Route>

            <Route element={<RequirePermission perm="presence:manage" />}>
              <Route path="presences" element={<PresencesPage />} />
              <Route path="presences/conges/nouveau" element={<CongeFormPage />} />
            </Route>

            <Route element={<RequirePermission perm="rapport:manage" />}>
              <Route path="rapports" element={<RapportsPage />} />
              <Route path="rapports/nouveau" element={<RapportFormPage />} />
            </Route>

            <Route element={<RequirePermission perm="project:read" />}>
              <Route path="projets" element={<ProjectsPage />} />
              <Route path="projets/:id" element={<ProjectDetailPage />} />
            </Route>
            <Route element={<RequirePermission perm="project:manage" />}>
              <Route path="projets/nouveau" element={<ProjectFormPage />} />
              <Route path="projets/:id/editer" element={<ProjectFormPage />} />
            </Route>

            <Route element={<RequirePermission perm="support:read" />}>
              <Route path="support" element={<SupportPage />} />
              <Route path="support/:id" element={<TicketDetailPage />} />
            </Route>

            <Route element={<RequirePermission perm="recrutement:read" />}>
              <Route path="recrutement" element={<RecrutementPage />} />
            </Route>

            <Route element={<RequirePermission perm="user:read" />}>
              <Route path="utilisateurs" element={<UsersPage />} />
            </Route>

            <Route element={<RequirePermission perm="audit:read" />}>
              <Route path="activite" element={<AuditPage />} />
            </Route>
            <Route element={<RequirePermission perm="ged.archive:read" />}>
              <Route path="archivage" element={<ArchivagePage />} />
            </Route>

            {/* --- Finance & Gestion -------------------------------------- */}
            <Route element={<RequirePermission perm="finance:read" />}>
              <Route path="finance/tiers" element={<TiersPage />} />
              <Route path="finance/frais" element={<NotesFraisPage />} />
              <Route path="finance/achats" element={<AchatsPage />} />
              <Route path="finance/factures" element={<FacturesClientPage />} />
              <Route path="finance/tresorerie" element={<TresoreriePage />} />
              <Route path="finance/budgets" element={<PilotagePage />} />
              <Route path="finance/inventaire" element={<InventairePage />} />
              <Route path="finance/rentabilite" element={<RentabiliteProjetsPage />} />
            </Route>
            <Route element={<RequirePermission perm="direction:read" />}>
              <Route path="cockpit" element={<CockpitPage />} />
            </Route>
            <Route element={<RequirePermission perm="commercial:read" />}>
              <Route path="appels-offres" element={<AppelsOffresPage />} />
            </Route>
            <Route element={<RequirePermission perm="studio:read" />}>
              <Route path="studio" element={<StudioPage />} />
            </Route>
            <Route element={<RequirePermission perm="rh.eval:read" />}>
              <Route path="evaluation" element={<EvaluationPage />} />
              <Route path="performance" element={<PerformancePage />} />
            </Route>
            <Route element={<RequirePermission perm="rh.onboarding:read" />}>
              <Route path="onboarding" element={<OnboardingPage />} />
            </Route>
            <Route element={<RequirePermission perm="rh.formation:read" />}>
              <Route path="formation" element={<FormationPage />} />
            </Route>

            <Route element={<RequirePermission perm="finance:manage" />}>
              <Route path="finance/paie" element={<PaiePage />} />
              <Route path="finance/comptabilite" element={<ComptabilitePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
