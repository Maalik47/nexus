import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { formatCurrency, formatDate } from '../lib/format.js';
import Spinner from '../components/Spinner.jsx';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/orders')
      .then((res) => active && setOrders(res.data.data))
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <header className="page__header">
        <h1>Mis Pedidos</h1>
        <p>Historial de tus compras en NexusGear.</p>
      </header>

      {loading ? (
        <Spinner label="Cargando pedidos..." />
      ) : orders.length === 0 ? (
        <div className="empty">
          <p>Aún no tienes pedidos.</p>
          <Link to="/catalogo" className="btn btn--primary">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.issued_at, true)}</td>
                  <td>{order.items}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <span className="badge badge--success">{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
