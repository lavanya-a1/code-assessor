import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';
import PlagiarismPage from './pages/PlagiarismPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import './styles/index.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const hideNavbar = ['admin', 'super_admin', 'principal', 'faculty', 'hod', 'student'].includes(user?.role);

  return (
    <>
      {isAuthenticated && !hideNavbar && <Navbar />}

      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/problems" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/problem/:id" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />
        <Route path="/plagiarism" element={<ProtectedRoute><PlagiarismPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
