import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../lib/format.js';

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  async function checkout() {
    setError('');
    if (!user) {
      navigate('/login', { state: { from: '/carrito' } });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
      });
      setConfirmation(res.data.data);
      clear();
    } catch (err) {
      setError(err.uiMessage || 'No se pudo completar el pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="page page--narrow">
        <div className="confirmation">
          <span className="confirmation__icon" aria-hidden="true">✓</span>
          <h1>¡Compra realizada!</h1>
          <p>
            Tu pedido <strong>#{confirmation.id}</strong> fue creado correctamente por un total de{' '}
            <strong>{formatCurrency(confirmation.total)}</strong>.
          </p>
          <div className="confirmation__actions">
            <Link to="/pedidos" className="btn btn--primary">Ver mis pedidos</Link>
            <Link to="/catalogo" className="btn btn--ghost">Seguir comprando</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Tu Carrito de Compras</h1>
        <p>Revisa tus productos antes de finalizar la compra.</p>
      </header>

      {items.length === 0 ? (
        <div className="empty">
          <p>Tu carrito está vacío.</p>
          <Link to="/catalogo" className="btn btn--primary">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            <div className="cart-table__head" aria-hidden="true">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Total</span>
            </div>
            <div className="cart-items">
            {items.map(({ product, quantity }) => (
              <article key={product.id} className="cart-item">
                <div className="cart-item__info">
                  <h3>{product.name}</h3>
                  <span>{product.category_name || 'Componentes'}</span>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Quitar uno">
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, Math.min(quantity + 1, product.stock ?? 99))}
                    aria-label="Agregar uno"
                  >
                    +
                  </button>
                </div>
                <div className="cart-item__price">{formatCurrency(Number(product.price) * quantity)}</div>
                <button type="button" className="cart-item__remove" onClick={() => removeItem(product.id)}>
                  Eliminar
                </button>
              </article>
            ))}
            </div>
          </div>

          <aside className="cart-summary">
            <h2>Resumen de Compra</h2>
            <div className="cart-summary__row">
              <span>Productos ({items.length})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total Estimado</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="button"
              className="btn btn--primary btn--block btn--lg"
              onClick={checkout}
              disabled={submitting}
            >
              {submitting ? 'Procesando...' : 'Proceder al Pago'}
            </button>
            {!user && <p className="hint">Inicia sesión para completar tu pedido.</p>}
            <p className="cart-summary__secure">🔒 Transacción segura de extremo a extremo</p>
          </aside>
        </div>
      )}
    </div>
  );
}
