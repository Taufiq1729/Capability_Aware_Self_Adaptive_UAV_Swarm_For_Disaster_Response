import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SwarmProvider } from './context/SwarmContext';
import { MainLayout } from './layouts/MainLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { LiveSimulationPage } from './pages/LiveSimulationPage';
import { FleetManagementPage } from './pages/FleetManagementPage';
import { FaultDiagnosisPage } from './pages/FaultDiagnosisPage';
import { CoordinationPage } from './pages/CoordinationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  return (
    <SwarmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<OverviewDashboard />} />
            <Route path="simulation" element={<LiveSimulationPage />} />
            <Route path="fleet" element={<FleetManagementPage />} />
            <Route path="faults" element={<FaultDiagnosisPage />} />
            <Route path="coordination" element={<CoordinationPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SwarmProvider>
  );
}
