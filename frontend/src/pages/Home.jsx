import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/products', { params: { limit: 8 } }),
      api.get('/categories')
    ])
      .then(([productsRes, categoriesRes]) => {
        if (!active) return;
        setFeatured(productsRes.data.data);
        setCategories(categoriesRes.data.data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const value = term.trim();
    navigate(value ? `/catalogo?search=${encodeURIComponent(value)}` : '/catalogo');
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__content">
          <span className="hero__eyebrow">🚚 Envío Gratis</span>
          <h1 className="hero__title">CONSTRUYE TU SETUP PERFECTO</h1>
          <p className="hero__subtitle">
            Hasta un 30% de descuento en Teclados, Audífonos y Componentes de última generación.
          </p>
          <Link to="/catalogo" className="btn btn--primary btn--lg">
            Ver Componentes
          </Link>
        </div>
        <div className="hero__glow" aria-hidden="true" />
      </section>

      <form className="search-bar" onSubmit={handleSearch} role="search">
        <input
          type="search"
          aria-label="Buscar componentes"
          placeholder="Buscar componentes (ej: teclado mecánico, tarjeta de video...)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">
          Buscar
        </button>
      </form>

      <div className="cats">
        {categories.map((category) => (
          <Link key={category.id} to={`/catalogo?categoryId=${category.id}`} className="chip">
            {category.name}
          </Link>
        ))}
      </div>

      {loading ? (
        <Spinner label="Cargando catálogo..." />
      ) : (
        <section className="section" id="destacados">
          <div className="section__header">
            <h2>Componentes Destacados</h2>
            <Link to="/catalogo" className="link">
              Ver todos
            </Link>
          </div>
          <div className="grid grid--products">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
