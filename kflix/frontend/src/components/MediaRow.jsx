import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function normalizeVideoPath(rawPath) {
  if (!rawPath) return '';

  // Strip surrounding quotes if any
  let cleaned = rawPath.replace(/^["']+|["']+$/g, '').trim();

  // If it's already a proper URL or a clean relative path, return as-is
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('/videos/')) {
    return cleaned;
  }

  // It's a local/absolute path (Windows or Unix) — extract just the filename
  // Replace backslashes with forward slashes first
  const normalized = cleaned.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop();

  // Determine subfolder from the path
  if (normalized.toLowerCase().includes('/shows/')) {
    return `/videos/shows/${fileName}`;
  }
  return `/videos/movies/${fileName}`;
}

function VideoPopup({ item, onClose }) {
  const videoSrc = normalizeVideoPath(item.video);
  return (
    <div className="popup-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="popup-box">
        <img className="popup-img" src={item.img} alt={item.name} />
        <div className="popup-img-gradient" />
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <div className="popup-body">
          <div className="popup-title">{item.name}</div>
          <div className="popup-genre">{item.type || item.genre}</div>
          {videoSrc ? (
            <video src={videoSrc} controls autoPlay
              style={{ width: '100%', marginTop: 14, borderRadius: 6, background: '#000', maxHeight: '40vh' }} />
          ) : (
            <div style={{ marginTop: 14, padding: '18px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🎬</div>
              <div>Video coming soon</div>
              <div style={{ fontSize: '0.72rem', marginTop: 4, color: 'rgba(255,255,255,0.3)' }}>
                Admin can assign a video from the Admin Panel
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockPopup({ item, onClose }) {
  return (
    <div className="popup-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="popup-box">
        <img className="popup-img" src={item.img} alt={item.name} />
        <div className="popup-img-gradient" />
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <div className="popup-body">
          <div className="popup-title">{item.name}</div>
          <div className="popup-genre">{item.type || item.genre}</div>
          <div className="popup-lock">
            <span className="popup-lock-icon">🔒</span>
            Login to watch this title in full HD
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaRow({ title, subtitle, items }) {
  const [popup, setPopup] = useState(null);
  const { isLoggedIn } = useAuth();

  // Guard: don't render empty rows
  if (!items || items.length === 0) return null;

  return (
    <div className="media-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {subtitle && <span className="section-sub">{subtitle}</span>}
      </div>
      <div className="cards-row">
        {items.map((item, i) => (
          <div key={item._id || i} className="card" onClick={() => setPopup(item)}>
            <img className="card-img" src={item.img} alt={item.name} loading="lazy"
              onError={e => { e.target.src = 'https://via.placeholder.com/178x140/1a1a1a/555?text=No+Image'; }} />
            <div className="card-overlay">
              <span className="card-play">{isLoggedIn ? '▶' : '🔒'}</span>
            </div>
            <div className="card-body">
              <div className="card-name">{item.name}</div>
              <div className="card-type">{item.type || item.genre}</div>
            </div>
          </div>
        ))}
      </div>

      {popup && (
        isLoggedIn
          ? <VideoPopup item={popup} onClose={() => setPopup(null)} />
          : <LockPopup  item={popup} onClose={() => setPopup(null)} />
      )}
    </div>
  );
}
