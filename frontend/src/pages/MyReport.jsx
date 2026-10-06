import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { formatCurrency, formatDate, formatNumber } from '../lib/format.js';
import Spinner from '../components/Spinner.jsx';

const CHART_TYPES = [
  { id: 'bar', label: 'Barras' },
  { id: 'line', label: 'Líneas' },
  { id: 'area', label: 'Área' }
];

export default function MyReport() {
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [chartType, setChartType] = useState('bar');
  const [rows, setRows] = useState([]);
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = { groupBy: 'day' };
      if (filters.from) params.from = `${filters.from}T00:00:00`;
      if (filters.to) params.to = `${filters.to}T23:59:59`;
      const res = await api.get('/reports/mine', { params });
      const data = res.data.data;
      setRows(data.rows);
      setSeries(
        data.series.map((point) => ({
          ...point,
          label: formatDate(point.period).slice(0, 5),
          total: Number(point.total)
        }))
      );
      setSummary(data.summary);
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudo cargar tu reporte');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const chartMargin = { top: 10, right: 20, bottom: 0, left: 10 };
  const chartGrid = <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />;
  const chartXAxis = (
    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
  );
  const chartYAxis = (
    <YAxis
      stroke="#94a3b8"
      tickFormatter={(v) => formatNumber(v)}
      tickLine={false}
      axisLine={false}
    />
  );
  const chartTooltip = (
    <Tooltip
      formatter={(value) => formatCurrency(value)}
      contentStyle={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(15,23,42,0.12)'
      }}
    />
  );

  return (
    <div className="page">
      <header className="page__header">
        <h1>Mi Reporte</h1>
        <p>Historial y estadísticas de tus transacciones en NexusGear.</p>
      </header>

      <section className="filters-bar">
        <div className="filters-bar__field">
          <label htmlFor="from">Desde</label>
          <input
            id="from"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="filters-bar__field">
          <label htmlFor="to">Hasta</label>
          <input
            id="to"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={load}>
          Aplicar
        </button>
      </section>

      {message && <p className="notice">{message}</p>}

      {loading ? (
        <Spinner label="Generando tu reporte..." />
      ) : rows.length === 0 ? (
        <div className="empty">
          <p>No registras transacciones en el período seleccionado.</p>
          <Link to="/catalogo" className="btn btn--primary">Explorar catálogo</Link>
        </div>
      ) : (
        <>
          {summary && (
            <div className="stats">
              <div className="stat">
                <span>Transacciones</span>
                <strong>{formatNumber(summary.orders)}</strong>
              </div>
              <div className="stat">
                <span>Unidades</span>
                <strong>{formatNumber(summary.units)}</strong>
              </div>
              <div className="stat">
                <span>Gasto total</span>
                <strong>{formatCurrency(summary.revenue)}</strong>
              </div>
              <div className="stat">
                <span>Compra promedio</span>
                <strong>{formatCurrency(summary.avgTicket)}</strong>
              </div>
            </div>
          )}

          <section className="card">
            <div className="card__header">
              <h2>Compras por día ($ CLP)</h2>
              <div className="chart__toolbar">
                <select
                  className="chart-type"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  aria-label="Tipo de gráfico"
                >
                  {CHART_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'bar' && (
                  <BarChart data={series} margin={chartMargin}>
                    {chartGrid}
                    {chartXAxis}
                    {chartYAxis}
                    {chartTooltip}
                    <Bar dataKey="total" fill="#1f5fdf" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
                {chartType === 'line' && (
                  <LineChart data={series} margin={chartMargin}>
                    {chartGrid}
                    {chartXAxis}
                    {chartYAxis}
                    {chartTooltip}
                    <Line type="monotone" dataKey="total" stroke="#1f5fdf" strokeWidth={2.5} dot={false} />
                  </LineChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={series} margin={chartMargin}>
                    {chartGrid}
                    {chartXAxis}
                    {chartYAxis}
                    {chartTooltip}
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#1f5fdf"
                      fill="#1f5fdf"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card__header">
              <h2>Detalle de transacciones</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Cant.</th>
                    <th>Precio unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.invoice_id}-${index}`}>
                      <td className="row-id">#{row.invoice_id}</td>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.product_name}</td>
                      <td>{row.category_name}</td>
                      <td>{row.quantity}</td>
                      <td>{formatCurrency(row.unit_price)}</td>
                      <td>{formatCurrency(row.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
