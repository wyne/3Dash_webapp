import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DemoModeProvider } from './contexts/DemoModeContext';
import { CameraControlsProvider } from './contexts/CameraControlsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { hasConfig, getConfig } from './services/configApi';
import Dashboard from './pages/Dashboard/Dashboard';

const ConfigEditor = lazy(() => import('./pages/ConfigEditor/ConfigEditor'));
const Onboarding = lazy(() => import('./pages/Onboarding/Onboarding'));

function AppRoutes() {
  const location = useLocation();

  // No config at all → onboarding. Config exists but not completed → onboarding.
  const configExists = hasConfig();
  const onboardingDone = configExists && (getConfig().onboarding?.completed ?? false);

  // Redirect to onboarding if not completed and not already there
  if (!onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/editor" element={<Suspense fallback={null}><ConfigEditor /></Suspense>} />
      <Route path="/onboarding" element={<Suspense fallback={null}><Onboarding /></Suspense>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <CameraControlsProvider>
          <AppRoutes />
        </CameraControlsProvider>
      </DemoModeProvider>
    </ThemeProvider>
  );
}
