import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Flows } from './pages/Flows';
import Controllers from './pages/Controllers'; // Default import
import { Devices } from './pages/Devices';
import { FlowEditor } from './pages/FlowEditor';
import Hardware from './pages/Hardware';
import { History } from './pages/History';
import { AnalyticsPage } from './pages/AnalyticsPage';
// import { Cycles } from './pages/Cycles';
// import { CycleEditor } from './pages/CycleEditor';
import { Programs } from './pages/Programs';
import { ProgramEditor } from './pages/ProgramEditor';
import { ActiveProgramPage } from './pages/ActiveProgramPage';
import { Settings } from './pages/Settings';
import { useStore } from './core/useStore';
import { hardwareService } from './services/hardwareService';
import { socketService } from './core/SocketService';
import { AIAssistantPage } from './pages/AIAssistantPage';

import { AIProvider } from './context/AIContext';
import { UIStateProvider } from './context/UIStateContext';
import { SimulationProvider } from './context/SimulationContext';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/flows" element={<Flows />} />
      <Route path="/controllers" element={<Controllers />} />
      <Route path="/devices" element={<Devices />} />
      <Route path="/editor" element={<FlowEditor />} />
      <Route path="/editor/:id" element={<FlowEditor />} />
      {/* <Route path="/cycles" element={<Cycles />} /> */}
      {/* <Route path="/cycles/new" element={<CycleEditor />} /> */}
      {/* <Route path="/cycles/:id" element={<CycleEditor />} /> */}
      <Route path="/programs" element={<Programs />} />
      <Route path="/programs/new" element={<ProgramEditor />} />
      <Route path="/programs/:id" element={<ProgramEditor />} />
      <Route path="/active-program" element={<ActiveProgramPage />} />
      <Route path="/hardware" element={<Hardware />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/assistant" element={<AIAssistantPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }
  }
);

function App() {
  const setDeviceTemplates = useStore((state) => state.setDeviceTemplates);

  useEffect(() => {
    socketService.connect();

    // Load Templates
    hardwareService.getDeviceTemplates()
      .then(templates => setDeviceTemplates(templates))
      .catch(err => console.error("Failed to load templates", err));

    return () => socketService.disconnect();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors position="top-center" />
      <AIProvider>
        <UIStateProvider>
          <SimulationProvider>
            <RouterProvider router={router} />
          </SimulationProvider>
        </UIStateProvider>
      </AIProvider>
    </ThemeProvider >
  );
}

export default App;

// Force rebuild
