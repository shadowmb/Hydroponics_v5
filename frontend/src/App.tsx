import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Programs } from './pages/Programs';
import Controllers from './pages/Controllers'; // Default import
import { Devices } from './pages/Devices';
import { FlowEditor } from './pages/FlowEditor';
import Hardware from './pages/Hardware'; // Default import
import { History } from './pages/History';
import { socketService } from './core/SocketService';

function App() {
  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/controllers" element={<Controllers />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/editor" element={<FlowEditor />} />
            <Route path="/editor/:id" element={<FlowEditor />} />
            <Route path="/hardware" element={<Hardware />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<div>Settings Page</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

// Force rebuild
