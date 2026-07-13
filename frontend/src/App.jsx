import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import HomePage from '@/pages/HomePage';
import OpenPage from '@/pages/OpenPage';
import ReportPage from '@/pages/ReportPage';
import TransformPage from '@/pages/TransformPage';

export default function App() {
  const location = useLocation();
  const isFullScreenView =
    location.pathname.startsWith('/report/') || location.pathname.startsWith('/transform/');

  if (isFullScreenView) {
    return (
      <Routes>
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/transform/:datasetId" element={<TransformPage />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/open" element={<OpenPage />} />
        </Routes>
      </main>
    </div>
  );
}
