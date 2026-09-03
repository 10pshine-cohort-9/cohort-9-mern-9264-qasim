import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

function getInitial(email) {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="app-header">
      <Link to="/dashboard" className="app-header-brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span className="app-header-brand-text">
          <span className="app-header-brand-name">NovaNote</span>
          <span className="app-header-brand-tag">Think it. Note it.</span>
        </span>
      </Link>
      <nav className="app-header-nav">
        <Link to="/profile" className="app-header-avatar" aria-label="Profile">
          {getInitial(user?.email)}
        </Link>
        <Link to="/profile" className="app-header-link">Profile</Link>
        <button type="button" onClick={handleLogout} className="app-header-logout">
          Log out
        </button>
      </nav>
    </header>
  );
}

export default AppHeader;
