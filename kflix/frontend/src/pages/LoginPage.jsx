import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password)        e.password = 'Password is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const user = await login({ username: form.username, password: form.password });
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setErrors({ password: err.message || 'Wrong username or password' });
    } finally {
      setLoading(false);
    }
  };

  const set = field => e => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <div className="auth-left-logo">KFLIX</div>
          <div className="auth-left-tagline">
            Your world of<br /><em>entertainment</em><br />awaits.
          </div>
          <div className="auth-left-features">
            <div className="auth-feature"><div className="auth-feature-icon">🎬</div>Thousands of movies &amp; shows</div>
            <div className="auth-feature"><div className="auth-feature-icon">📺</div>Stream in Full HD</div>
            <div className="auth-feature"><div className="auth-feature-icon">⚡</div>New titles every week</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-form-title">Welcome Back</h1>
          <p className="auth-form-sub">Sign in to continue watching</p>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input className="form-input" placeholder="Enter username"
                value={form.username} onChange={set('username')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            {errors.username && <p style={{ color: '#e50914', fontSize: '0.78rem', marginTop: 5 }}>{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input className="form-input" type="password" placeholder="Enter password"
                value={form.password} onChange={set('password')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            {errors.password && <p style={{ color: '#e50914', fontSize: '0.78rem', marginTop: 5 }}>{errors.password}</p>}
          </div>

          <button className="btn-auth" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          <div className="auth-switch" style={{ marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-switch-link">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
