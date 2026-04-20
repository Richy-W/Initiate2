import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CharactersPage from './pages/characters/CharactersPage';
import CharacterDetailPage from './pages/characters/CharacterDetailPage';
import CharacterCreatePage from './pages/characters/CharacterCreatePage';
import CampaignsPage from './pages/campaigns/CampaignsPage';
import CampaignDetailPage from './pages/campaigns/CampaignDetailPage';
import CombatPage from './pages/combat/CombatPage';
import ContentPage from './pages/content/ContentPage';
import ProfilePage from './pages/profile/ProfilePage';
import HelpPage from './pages/HelpPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { setGlobalApiErrorHandler } from './services/apiClient';
import './App.css';

const ApiErrorBridge: React.FC = () => {
  const { notifyError } = useNotification();

  useEffect(() => {
    setGlobalApiErrorHandler(notifyError);
    return () => setGlobalApiErrorHandler(null);
  }, [notifyError]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ApiErrorBridge />
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Nested routes inside Layout */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />

                  {/* Character routes */}
                  <Route path="characters">
                    <Route index element={<CharactersPage />} />
                    <Route path="create" element={<CharacterCreatePage />} />
                    <Route path=":characterId" element={<CharacterDetailPage />} />
                    <Route path=":characterId/edit" element={<CharacterCreatePage />} />
                  </Route>

                  {/* Campaign routes */}
                  <Route path="campaigns">
                    <Route index element={<CampaignsPage />} />
                    <Route path=":campaignId" element={<CampaignDetailPage />} />
                    <Route path=":campaignId/combat/:encounterId?" element={<CombatPage />} />
                  </Route>

                  {/* Content routes */}
                  <Route path="content">
                    <Route index element={<ContentPage />} />
                    <Route path=":contentType" element={<ContentPage />} />
                  </Route>

                  {/* Profile routes */}
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Help / onboarding */}
                  <Route path="help" element={<HelpPage />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
