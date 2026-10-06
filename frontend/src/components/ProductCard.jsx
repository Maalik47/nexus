import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../lib/format.js';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const outOfStock = Number(product.stock) <= 0;

  function handleAdd() {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="product-card__media">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="product-card__placeholder" aria-hidden="true">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
        {outOfStock ? (
          <span className="badge badge--muted">Agotado</span>
        ) : product.featured ? (
          <span className="badge badge--accent">Oferta</span>
        ) : (
          <span className="badge badge--new">Nuevo</span>
        )}
      </Link>

      <div className="product-card__body">
        <span className="product-card__category">{product.category_name || 'Componentes'}</span>
        <h3 className="product-card__title">
          <Link to={`/producto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__price">{formatCurrency(product.price)}</p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={handleAdd}
          disabled={outOfStock}
        >
          {added ? 'Agregado ✓' : 'Agregar al carrito'}
        </button>
      </div>
    </article>
  );
}
