import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../lib/format.js';
import Spinner from '../components/Spinner.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((res) => active && setProduct(res.data.data))
      .catch(() => active && setProduct(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner label="Cargando producto..." />;

  if (!product) {
    return (
      <div className="page page--narrow empty">
        <p>Producto no encontrado.</p>
        <Link to="/catalogo" className="btn btn--primary">Volver al catálogo</Link>
      </div>
    );
  }

  const outOfStock = Number(product.stock) <= 0;

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Ruta">
        <Link to="/">Inicio</Link> / <Link to="/catalogo">Catálogo</Link> / <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail__media">
          {product.image_url && !imgError ? (
            <img src={product.image_url} alt={product.name} onError={() => setImgError(true)} />
          ) : (
            <span className="product-card__placeholder" aria-hidden="true">
              {product.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="product-detail__info">
          <span className="product-card__category">{product.category_name || 'Componentes'}</span>
          <h1>{product.name}</h1>
          <p className="product-detail__price">{formatCurrency(product.price)}</p>
          <p className="product-detail__description">
            {product.description || 'Sin descripción disponible.'}
          </p>
          <p className="product-detail__stock">
            {outOfStock ? 'Agotado' : `Disponible: ${product.stock} unidades`}
          </p>

          <div className="product-detail__actions">
            <div className="qty">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Menos">
                −
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Más">
                +
              </button>
            </div>
            <button type="button" className="btn btn--primary btn--lg" onClick={handleAdd} disabled={outOfStock}>
              {added ? 'Agregado ✓' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
