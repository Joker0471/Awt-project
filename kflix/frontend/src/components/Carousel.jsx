import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Carousel({ items }) {
  const [idx,   setIdx]   = useState(0);
  const [popup, setPopup] = useState(null);
  const { isLoggedIn } = useAuth();

  // Guard against empty items
  const safeItems = items && items.length > 0 ? items : [];

  useEffect(() => {
    if (safeItems.length === 0) return;
    const t = setInterval(() => setIdx(i => (i + 1) % safeItems.length), 3800);
    return () => clearInterval(t);
  }, [safeItems.length]);

  if (safeItems.length === 0) return null;

  return (
    <>
      <div className="carousel-section">
        <div className="carousel-outer">
          <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {safeItems.map((item, i) => (
              <div key={item._id || i} className="carousel-slide" onClick={() => setPopup(item)}>
                <img src={item.img} alt={item.name} />
                <div className="carousel-overlay" />
                <div className="carousel-info">
                  <div className="carousel-title">{item.name}</div>
                  <div className="carousel-type">{item.type || item.genre}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="carousel-dots">
          {safeItems.map((_, i) => (
            <div key={i} className={`carousel-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} />
          ))}
        </div>
      </div>

      {popup && (
        <div className="popup-overlay" onClick={e => { if (e.target === e.currentTarget) setPopup(null); }}>
          <div className="popup-box">
            <img className="popup-img" src={popup.img} alt={popup.name} />
            <div className="popup-img-gradient" />
            <button className="popup-close-btn" onClick={() => setPopup(null)}>✕</button>
            <div className="popup-body">
              <div className="popup-title">{popup.name}</div>
              <div className="popup-genre">{popup.type || popup.genre}</div>
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
