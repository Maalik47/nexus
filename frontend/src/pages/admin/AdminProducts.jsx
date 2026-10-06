import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { formatCurrency } from '../../lib/format.js';
import Spinner from '../../components/Spinner.jsx';

const EMPTY = { name: '', description: '', price: '', stock: '', categoryId: '', featured: false };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.get('/products', { params: { limit: 100 } }), api.get('/categories')])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data.data);
        setCategories(catRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      categoryId: product.category_id || '',
      featured: Boolean(product.featured)
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      featured: form.featured
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage('Producto actualizado.');
      } else {
        await api.post('/products', payload);
        setMessage('Producto creado.');
      }
      resetForm();
      load();
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudo guardar el producto');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage('Producto eliminado.');
      load();
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudo eliminar');
    }
  }

  if (loading) return <Spinner label="Cargando productos..." />;

  return (
    <div className="page">
      <header className="page__header page__header--row">
        <div>
          <h1>Gestión de Productos</h1>
          <p>Administra el catálogo de NexusGear.</p>
        </div>
        <Link to="/admin/inventario" className="btn btn--ghost btn--sm">
          Ver inventario
        </Link>
      </header>

      <div className="admin-grid">
        <section className="card">
          <div className="card__header">
            <h2>{editingId ? `Editar producto #${editingId}` : 'Nuevo producto'}</h2>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <label htmlFor="p-name">Nombre</label>
            <input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label htmlFor="p-desc">Descripción</label>
            <textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <label htmlFor="p-price">Precio</label>
            <input
              id="p-price"
              type="number"
              min="0"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <label htmlFor="p-stock">Stock</label>
            <input
              id="p-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />

            <label htmlFor="p-cat">Categoría</label>
            <select
              id="p-cat"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="filters__checkbox">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Destacado
            </label>

            {message && <p className="notice">{message}</p>}

            <div className="form__actions">
              <button type="submit" className="btn btn--primary">{editingId ? 'Guardar' : 'Crear'}</button>
              {editingId && (
                <button type="button" className="btn btn--ghost" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Catálogo</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{p.stock}</td>
                    <td className="table__actions">
                      <button type="button" className="link" onClick={() => startEdit(p)}>Editar</button>
                      <button type="button" className="link link--danger" onClick={() => handleDelete(p.id)}>
                        Eliminar
                      </button>
                    </td>
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
