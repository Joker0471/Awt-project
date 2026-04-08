import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mediaAPI } from '../api';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [popup,    setPopup]    = useState(null);
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); return; }
    try {
      const data = await mediaAPI.search(val);
      setResults((data || []).map(item => ({ ...item, type: item.genre || item.type })));
    } catch {
      setResults([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = path => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="navbar-logo">KFLIX</Link>

        <div className="navbar-center">
          <Link to="/"       className={isActive('/')}>Home</Link>
          <Link to="/movies" className={isActive('/movies')}>Movies</Link>
          <Link to="/series" className={isActive('/series')}>Series</Link>
        </div>

        <div className="navbar-right">
          <div className="search-wrap" ref={searchRef}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search titles..."
              value={query} onChange={e => handleSearch(e.target.value)} />
            {results.length > 0 && (
              <div className="search-dropdown">
                {results.map((item, i) => (
                  <div key={i} className="search-item"
                    onClick={() => { setPopup(item); setResults([]); setQuery(''); }}>
                    <img src={item.img} alt={item.name} onError={e => e.target.style.display='none'} />
                    <div>
                      <div className="search-item-name">{item.name}</div>
                      <div className="search-item-type">{item.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" style={{ color: '#f59e0b', fontSize: '0.82rem', textDecoration: 'none' }}>
                  ⚙️ Admin
                </Link>
              )}
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
                👤 {user?.username || (isAdmin ? 'admin' : 'user')}
              </span>
              <button onClick={handleLogout} className="btn-nav-outline"
                style={{ cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 16px', borderRadius: 6, fontSize: '0.85rem' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn-nav-outline">Login</Link>
              <Link to="/signup" className="btn-nav-solid">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {popup && (
        <div className="popup-overlay" onClick={e => e.target === e.currentTarget && setPopup(null)}>
          <div className="popup-box">
            <img className="popup-img" src={popup.img} alt={popup.name} />
            <div className="popup-img-gradient" />
            <button className="popup-close-btn" onClick={() => setPopup(null)}>✕</button>
            <div className="popup-body">
              <div className="popup-title">{popup.name}</div>
              <div className="popup-genre">{popup.type}</div>
              {isLoggedIn ? (
                popup.video ? (
                  <video src={popup.video} controls autoPlay
                    style={{ width: '100%', marginTop: 14, borderRadius: 6, background: '#000', maxHeight: '38vh' }} />
                ) : (
                  <div style={{ marginTop: 14, padding: '14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>🎬</div>
                    <div>Video coming soon</div>
                  </div>
                )
              ) : (
                <div className="popup-lock">
                  <span className="popup-lock-icon">🔒</span>
                  Login to watch this title in full HD
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
