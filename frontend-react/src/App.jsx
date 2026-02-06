import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';
import PlagiarismPage from './pages/PlagiarismPage';
import DashboardPage from './pages/DashboardPage';
import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/problems" element={<HomePage />} />
          <Route path="/problem/:id" element={<ProblemPage />} />
          <Route path="/plagiarism" element={<PlagiarismPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
