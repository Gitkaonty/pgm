import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './context/Layout';
import RequireAuth from './context/RequireAuth';
import NotFoundPage from './pages/NotFoundPage';
import Unauthorized from './pages/Unauthorized';
import Login from './Auth/Login';
import PersistLogin from './Auth/PersistLogin';
import useAutoLogout from './hooks/useAutoLogout';
import theme from './theme';
import { ThemeProvider, CssBaseline } from '@mui/material';
import MainLayout from './pages/MainLayout';
import DashboardHome from './pages/DashboardHome';
import IdentiteStatique from './pages/gestionmembre/identiteStatique';
import MembreDetail from './pages/gestionmembre/MembreDetail';
import Exercices from './pages/parametres/exercices';
import GrilleTarifaire from './pages/parametres/grilleTarifaire';
import SituationMembre from './pages/gestionmembre/SituationMembre';
import AppelCotisation from './pages/cotisation/AppelCotisation';
import Paiement from './pages/cotisation/Paiement';
import GrandLivrePage from './pages/cotisation/GrandLivre';
import OrderInfoPage from './pages/oecfm';
import AttestationsPage from './pages/attestation/attestation';
import ValidationAttestationsPage from './pages/attestation/validation';
import MembrePublic from './pages/public/MembrePublic';
// Importe ton hook d'auth pour remplacer "isAuthenticated" par une vraie valeur
import useAuth from './hooks/useAuth';

const ROLES = {
  'SuperAdmin': 3355,
  'User': 2001,
  'Editor': 1984,
  'Admin': 5150
}

export default function App() {
  useAutoLogout();
  const { auth } = useAuth(); // On récupère l'état d'auth réel

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <Routes>
        {/* Page publique (scan QR) — hors authentification et hors layout app */}
        <Route path="/m/:id" element={<MembrePublic />} />

        <Route path="/" element={<Layout />}>
          
          {/* --- ROUTES PUBLIQUES --- */}
          <Route path='/' element={<Login />} />
          <Route path='/unauthorized' element={<Unauthorized />} />

          {/* --- ROUTES PROTEGEES --- */}
          <Route element={<PersistLogin />}>
            <Route element={<RequireAuth allowedRoles={[ROLES.Admin, ROLES.User, ROLES.Editor, ROLES.SuperAdmin]} />}>
              
              {/* Le MainLayout entoure ici toutes les pages "Admin" */}
              <Route path="/oecfm" element={<MainLayout><OrderInfoPage /></MainLayout>} />
              <Route path="/dashboard" element={<MainLayout><DashboardHome /></MainLayout>} />

               {/* Sous-menu Gestion des Membres */}
              <Route path="/membres/liste" element={<MainLayout><IdentiteStatique /></MainLayout>} />
              <Route path="/membres/historique" element={<MainLayout><MembreDetail /></MainLayout>} />  
              <Route path="/membres/situation" element={<MainLayout><SituationMembre /></MainLayout>} />   

              {/* Sous-menu Cotisations */}
              <Route path="/cotisation/appel" element={<MainLayout><AppelCotisation /></MainLayout>} />
              <Route path="/cotisation/paiement" element={<MainLayout><Paiement /></MainLayout>} />
              <Route path="/cotisation/grandlivre" element={<MainLayout><GrandLivrePage /></MainLayout>} />

              {/* Sous-menu Attestation */}
              <Route path="/attestation/demande" element={<MainLayout><AttestationsPage /></MainLayout>} />
              <Route path="/attestation/validation" element={<MainLayout><ValidationAttestationsPage /></MainLayout>} />
              
              {/* Sous-menu Parametres */}
              
            </Route>
            <Route element={<RequireAuth allowedRoles={[ROLES.Admin, ROLES.SuperAdmin]} />}>
              <Route path="/parametres/exercices" element={<MainLayout><Exercices /></MainLayout>} />
              <Route path="/parametres/tarifs" element={<MainLayout><GrilleTarifaire /></MainLayout>} />
            </Route>
              
          </Route>

          {/* CATCH ALL */}
          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}