import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import MediaRow from '../components/MediaRow';
import { mediaAPI } from '../api';

export default function HomePage() {
  const [moviesData, setMoviesData] = useState({});
  const [showsData, setShowsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await mediaAPI.getGrouped();
        // Transform genre to type to match frontend expectations
        const transformItems = (items) => items.map(item => ({ ...item, type: item.genre }));
        
        const transformedMovies = {};
        for (const [platform, items] of Object.entries(data.movies || {})) {
          transformedMovies[platform] = transformItems(items);
        }
        
        const transformedShows = {};
        for (const [platform, items] of Object.entries(data.shows || {})) {
          transformedShows[platform] = transformItems(items);
        }
        
        setMoviesData(transformedMovies);
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

  const carouselItems = [
    ...(moviesData.TOP || []).slice(0, 4),
    ...(showsData.TOP || []).slice(0, 3),
  ];
  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Now Streaming
          </div>
          <h1 className="hero-title">Unlimited<br />Movies &amp;<br />Shows</h1>
          <p className="hero-desc">
            Thousands of titles across every genre — blockbusters, cult classics,
            award-winning series. Your next obsession starts here.
          </p>
          <div className="hero-actions">
            <Link to="/movies" className="btn-primary">▶ Browse Movies</Link>
            <Link to="/series" className="btn-secondary">View Series</Link>
          </div>
        </div>
      </div>

      {/* CAROUSEL */}
      <Carousel items={carouselItems} />

      {/* ROWS */}
      <MediaRow title="Top Movies"        subtitle="All Time Best"  items={moviesData.TOP} />
      <MediaRow title="Netflix Originals" subtitle="Netflix"        items={moviesData.NETFLIX} />
      <MediaRow title="Top Shows"         subtitle="Must Watch"     items={showsData.TOP} />
      <MediaRow title="Marvel Universe"   subtitle="MCU"            items={moviesData.MARVEL} />
      <MediaRow title="HBO Series"        subtitle="Premium"        items={showsData.HBO} />
      <MediaRow title="Prime Video"       subtitle="Amazon"         items={moviesData.PRIME} />

      <footer className="footer">
        <div className="footer-logo">KFLIX</div>
        <div className="footer-text">© 2026 KFLIX ·</div>
      </footer>
    </div>
  );
}
