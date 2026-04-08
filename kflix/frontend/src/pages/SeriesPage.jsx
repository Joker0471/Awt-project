import { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import { mediaAPI } from '../api';

const PLATFORM_LABELS = {
  NETFLIX: 'Netflix Shows', PRIME: 'Prime Shows', HBO: 'HBO',
  DISNEY: 'Disney+', HOTSTAR: 'Hotstar', TOP: 'Top Shows',
};

export default function SeriesPage() {
  const [showsData, setShowsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await mediaAPI.getGrouped();
        const transformItems = (items) => items.map(item => ({ ...item, type: item.genre }));
        const transformedShows = {};
        for (const [platform, items] of Object.entries(data.shows || {})) {
          transformedShows[platform] = transformItems(items);
        }
        setShowsData(transformedShows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  // Preferred display order; any unknown/new platform is appended at the end
  const ORDER = ['TOP', 'NETFLIX', 'PRIME', 'HBO', 'DISNEY', 'HOTSTAR'];
  const platforms = [
    ...ORDER.filter(p => showsData[p]),
    ...Object.keys(showsData).filter(p => !ORDER.includes(p)),
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-tag">📺 All Series</div>
        <h1 className="page-header-title">Series</h1>
        <p className="page-header-desc">
          Binge-worthy shows from the world's best streaming platforms — all in one place.
        </p>
      </div>

      {platforms.map(platform => (
        <MediaRow
          key={platform}
          title={PLATFORM_LABELS[platform] || platform}
          items={showsData[platform]}
        />
      ))}

      {platforms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.4)' }}>
          No series yet. Add some from the Admin panel.
        </div>
      )}

      <footer className="footer">
        <div className="footer-logo">KFLIX</div>
        <div className="footer-text">© 2026 KFLIX</div>
      </footer>
    </div>
  );
}
