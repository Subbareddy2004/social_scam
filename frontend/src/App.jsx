import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import AdminLayout, { Dashboard } from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import PendingPosts from './pages/admin/PendingPosts';
import RejectedPosts from './pages/admin/RejectedPosts';
import UserManagement from './pages/admin/UserManagement';

function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Home page has its own navbar, so skip the shared one
  const hideNavbar = ['/', '/login', '/register', '/admin/login'].includes(location.pathname);

  return (
    <div className="app-layout">
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<Home />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
        <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        {/* Admin login (separate from user login) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pending" element={<PendingPosts />} />
          <Route path="rejected" element={<RejectedPosts />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

