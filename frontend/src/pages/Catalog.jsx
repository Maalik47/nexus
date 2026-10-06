import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const featured = searchParams.get('featured') === 'true';
  const categoryId = searchParams.get('categoryId') || '';
  const query = searchParams.get('search') || '';

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { limit: 60 };
    if (featured) params.featured = true;
    if (categoryId) params.categoryId = categoryId;
    if (query) params.search = query;

    api
      .get('/products', { params })
      .then((res) => active && setProducts(res.data.data))
      .catch(() => active && setProducts([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [featured, categoryId, query]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function handleSearch(event) {
    event.preventDefault();
    updateParam('search', search.trim());
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>{featured ? 'Ofertas' : 'Catálogo'}</h1>
        <p>Periféricos y componentes para llevar tu setup al siguiente nivel.</p>
      </header>

      <div className="catalog">
        <aside className="filters" aria-label="Filtros">
          <form onSubmit={handleSearch} className="filters__search">
            <label htmlFor="search">Buscar</label>
            <input
              id="search"
              type="search"
              placeholder="Teclado, mouse, monitor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn--ghost btn--sm">
              Buscar
            </button>
          </form>

          <div className="filters__group">
            <span className="filters__title">Categorías</span>
            <button
              type="button"
              className={`chip ${!categoryId ? 'chip--active' : ''}`}
              onClick={() => updateParam('categoryId', '')}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`chip ${String(category.id) === categoryId ? 'chip--active' : ''}`}
                onClick={() => updateParam('categoryId', String(category.id))}
              >
                {category.name}
              </button>
            ))}
          </div>

          <label className="filters__checkbox">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
            />
            Solo destacados
          </label>
        </aside>

        <section className="catalog__results">
          {loading ? (
            <Spinner label="Cargando productos..." />
          ) : products.length === 0 ? (
            <p className="empty">No se encontraron productos con esos filtros.</p>
          ) : (
            <div className="grid grid--products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
