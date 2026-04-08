import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '', w: '0%' };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const map = [
    { label: '',       color: '#333',    w: '0%'   },
    { label: 'Weak',   color: '#e50914', w: '25%'  },
    { label: 'Fair',   color: '#f59e0b', w: '50%'  },
    { label: 'Good',   color: '#3b82f6', w: '75%'  },
    { label: 'Strong', color: '#22c55e', w: '100%' },
  ];
  return map[s];
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form,    setForm]    = useState({ username: '', email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const strength = getStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.username.trim())      e.username = 'Username is required';
    if (!form.email.includes('@'))  e.email    = 'Enter a valid email';
    if (form.password.length < 6)   e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await signup({ username: form.username, email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      // Show server-side errors (e.g. "Username already in use")
      const msg = err.message || 'Signup failed';
      if (msg.toLowerCase().includes('username')) setErrors({ username: msg });
      else if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
      else setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <div className="auth-left-logo">K<span>FLIX</span></div>
          <div className="auth-left-tagline">
            Join millions<br />of <em>viewers</em><br />today.
          </div>
          <div className="auth-left-features">
            <div className="auth-feature"><div className="auth-feature-icon">🆓</div>Free to sign up</div>
            <div className="auth-feature"><div className="auth-feature-icon">🔓</div>Unlock all content</div>
            <div className="auth-feature"><div className="auth-feature-icon">💾</div>Save your watchlist</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-form-title">Create Account</h1>
          <p className="auth-form-sub">Join KFLIX and start watching today — it's free</p>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input className="form-input" placeholder="Choose a username"
                value={form.username} onChange={set('username')} />
            </div>
            {errors.username && <p style={{ color: '#e50914', fontSize: '0.78rem', marginTop: 5 }}>{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={form.email} onChange={set('email')} />
            </div>
            {errors.email && <p style={{ color: '#e50914', fontSize: '0.78rem', marginTop: 5 }}>{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input className="form-input" type="password" placeholder="Create a strong password"
                value={form.password} onChange={set('password')} />
            </div>
            {form.password && (
              <div>
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: strength.w, background: strength.color }} />
                </div>
                <p style={{ fontSize: '0.72rem', color: strength.color, marginTop: 4 }}>{strength.label}</p>
              </div>
            )}
            {errors.password && <p style={{ color: '#e50914', fontSize: '0.78rem', marginTop: 5 }}>{errors.password}</p>}
          </div>

          <button className="btn-auth" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>

          <div className="auth-divider">or</div>

          <div className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </div>

          <div className="auth-terms">
            By creating an account you agree to our{' '}
            <span style={{ color: 'var(--red)', cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: 'var(--red)', cursor: 'pointer' }}>Privacy Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
