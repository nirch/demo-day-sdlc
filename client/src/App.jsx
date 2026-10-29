import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import EventListPage from './pages/EventListPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailPage from './pages/EventDetailPage';
import JudgeJoinPage from './pages/JudgeJoinPage';
import ScoringsSummaryPage from './pages/ScoringsSummaryPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/judge-invite/:token" element={<JudgeJoinPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route element={<AdminRoute />}>
              <Route path="/" element={<EventListPage />} />
              <Route path="/events/new" element={<CreateEventPage />} />
            </Route>
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/events/:id/scoring-summary" element={<ScoringsSummaryPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
