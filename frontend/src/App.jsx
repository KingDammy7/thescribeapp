import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import ToastHost from './components/ToastHost';

// Layout
import AppShell from './components/AppShell';

// Public pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import VoiceInterview from './pages/VoiceInterview';
import VoiceFromBooks from './pages/VoiceFromBooks';
import VoicePreview from './pages/VoicePreview';
import { PrivacyPolicy, TermsOfService } from './pages/Legal';

// App pages (require auth)
import Dashboard from './pages/Dashboard';
import Manuscripts from './pages/Manuscripts';
import NewManuscript from './pages/NewManuscript';
import Editor from './pages/Editor';
import GenerationMode from './pages/GenerationMode';
import VoiceProfile from './pages/VoiceProfile';
import ScriptureStudio from './pages/ScriptureStudio';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { token } = useStore();
  const location = useLocation();
  if (!token) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}

function AppInit() {
  const { token, fetchMe, fetchVoiceProfile, theme } = useStore();

  useEffect(() => {
    if (token) {
      fetchMe();
      fetchVoiceProfile();
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <ToastHost />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/interview" element={<RequireAuth><VoiceInterview /></RequireAuth>} />
        <Route path="/interview-from-books" element={<RequireAuth><VoiceFromBooks /></RequireAuth>} />
        <Route path="/voice-preview" element={<RequireAuth><VoicePreview /></RequireAuth>} />

        {/* App shell with sidebar */}
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manuscripts" element={<Manuscripts />} />
          <Route path="/new-manuscript" element={<NewManuscript />} />
          <Route path="/voice-profile" element={<VoiceProfile />} />
          <Route path="/scripture-studio" element={<ScriptureStudio />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Full-screen pages (no sidebar) */}
        <Route path="/editor/:id" element={<RequireAuth><Editor /></RequireAuth>} />
        <Route path="/generate/:id" element={<RequireAuth><GenerationMode /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
