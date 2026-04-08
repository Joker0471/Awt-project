import { useState, useEffect } from 'react';
import MediaRow from '../components/MediaRow';
import { mediaAPI } from '../api';

const PLATFORM_LABELS = {
  NETFLIX: 'Netflix', PRIME: 'Prime Video', MARVEL: 'Marvel',
  DC: 'DC Universe', ROMANTIC: 'Romantic', DREAMWORKS: 'DreamWorks', TOP: 'Top Movies',
};

export default function MoviesPage() {
  const [moviesData, setMoviesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await mediaAPI.getGrouped();
        const transformItems = (items) => items.map(item => ({ ...item, type: item.genre }));
        const transformedMovies = {};
        for (const [platform, items] of Object.entries(data.movies || {})) {
          transformedMovies[platform] = transformItems(items);
        }
        setMoviesData(transformedMovies);
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
  const ORDER = ['TOP', 'NETFLIX', 'PRIME', 'MARVEL', 'DC', 'ROMANTIC', 'DREAMWORKS'];
  const platforms = [
    ...ORDER.filter(p => moviesData[p]),
    ...Object.keys(moviesData).filter(p => !ORDER.includes(p)),
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-tag">🎬 All Movies</div>
        <h1 className="page-header-title">Movies</h1>
        <p className="page-header-desc">
          Blockbusters, cult classics, hidden gems — browse by platform or genre.
        </p>
      </div>

      {platforms.map(platform => (
        <MediaRow
          key={platform}
          title={PLATFORM_LABELS[platform] || platform}
          items={moviesData[platform]}
        />
      ))}

      {platforms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.4)' }}>
          No movies yet. Add some from the Admin panel.
        </div>
      )}

      <footer className="footer">
        <div className="footer-logo">KFLIX</div>
        <div className="footer-text">© 2026 KFLIX</div>
      </footer>
    </div>
  );
}
