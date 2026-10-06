import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { formatDate, formatNumber } from '../../lib/format.js';
import Spinner from '../../components/Spinner.jsx';

export default function AdminInventory() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ productId: '', type: 'entrada', quantity: 1, reason: '' });
  const [message, setMessage] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.get('/inventory'), api.get('/products', { params: { limit: 100 } })])
      .then(([movRes, prodRes]) => {
        setMovements(movRes.data.data);
        setProducts(prodRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api.post(`/inventory/${form.productId}/adjust`, {
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason
      });
      setMessage('Movimiento registrado correctamente.');
      setForm({ productId: '', type: 'entrada', quantity: 1, reason: '' });
      load();
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudo registrar el movimiento');
    }
  }

  if (loading) return <Spinner label="Cargando inventario..." />;

  return (
    <div className="page">
      <header className="page__header">
        <h1>Administración de Inventario</h1>
        <p>Movimientos de stock y ajustes manuales.</p>
      </header>

      <div className="admin-grid">
        <section className="card">
          <div className="card__header">
            <h2>Registrar movimiento</h2>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="product">Producto</label>
            <select
              id="product"
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {p.stock})
                </option>
              ))}
            </select>

            <label htmlFor="type">Tipo</label>
            <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
            </select>

            <label htmlFor="quantity">Cantidad</label>
            <input
              id="quantity"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />

            <label htmlFor="reason">Motivo</label>
            <input
              id="reason"
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />

            {message && <p className="notice">{message}</p>}

            <button type="submit" className="btn btn--primary btn--block">
              Guardar movimiento
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Movimientos recientes</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cant.</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDate(m.created_at, true)}</td>
                    <td>{m.product_name}</td>
                    <td>
                      <span className={`badge badge--${m.movement_type === 'salida' ? 'warning' : 'success'}`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td>{formatNumber(m.quantity)}</td>
                    <td>{formatNumber(m.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
