import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import { formatCurrency, formatDate, formatNumber } from '../../lib/format.js';
import Spinner from '../../components/Spinner.jsx';

const TABS = [
  { id: 'tabular', label: 'Ventas Tabular' },
  { id: 'chart', label: 'Ventas Gráfico' },
  { id: 'consolidated', label: 'Consolidado' }
];

const CHART_TYPES = [
  { id: 'bar', label: 'Barras' },
  { id: 'line', label: 'Líneas' },
  { id: 'area', label: 'Área' },
  { id: 'pie', label: 'Torta' }
];

const CHART_COLORS = [
  '#1f5fdf',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#ec4899'
];

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

export default function AdminReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'tabular';
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: '',
    from: '2026-10-01',
    to: '2026-10-31'
  });
  const [includeExternal, setIncludeExternal] = useState(false);
  const [rows, setRows] = useState([]);
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [externalStatus, setExternalStatus] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const queryParams = useCallback(() => {
    const params = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.from) params.from = `${filters.from}T00:00:00`;
    if (filters.to) params.to = `${filters.to}T23:59:59`;
    return params;
  }, [filters]);

  function selectTab(id) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = queryParams();

      if (includeExternal) {
        const res = await api.get('/reports/combined', { params: { ...params, groupBy: 'day' } });
        const data = res.data.data;
        setRows(data.rows);
        setSeries(
          data.series.map((point) => ({
            ...point,
            label: formatDate(point.period).slice(0, 5),
            local: Number(point.local),
            external: Number(point.external),
            total: Number(point.total)
          }))
        );
        setSummary(data.summary);
        setExternalStatus(data.external);
      } else {
        const [rowsRes, seriesRes, summaryRes] = await Promise.all([
          api.get('/reports/sales', { params }),
          api.get('/reports/sales/series', { params: { ...params, groupBy: 'day' } }),
          api.get('/reports/sales/summary', { params })
        ]);
        setRows(rowsRes.data.data);
        setSeries(
          seriesRes.data.data.map((point) => ({
            ...point,
            label: formatDate(point.period).slice(0, 5),
            total: Number(point.total)
          }))
        );
        setSummary(summaryRes.data.data);
        setExternalStatus(null);
      }
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudieron cargar los informes');
    } finally {
      setLoading(false);
    }
  }, [queryParams, includeExternal]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport(format) {
    try {
      const res = await api.get('/reports/export', {
        params: { ...queryParams(), format, dataset: 'sales' },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ventas.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudo exportar');
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/reports/import', formData, {
        params: { dataset: 'inventory' },
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`Importación exitosa: ${res.data.data.imported} movimientos creados.`);
      load();
    } catch (err) {
      setMessage(err.uiMessage || 'No se pudo importar el archivo');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const columnCount = includeExternal ? 7 : 6;

  const chartMargin = { top: 10, right: 20, bottom: 0, left: 10 };
  const chartGrid = (
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
  );
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
      <header className="page__header page__header--row">
        <div>
          <h1>Informes de Ventas</h1>
          <p>Vista detallada de transacciones registradas.</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleExport('csv')}>
            Exportar CSV
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleExport('json')}>
            Exportar JSON
          </button>
          <label className="btn btn--ghost btn--sm">
            Importar
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              hidden
              onChange={handleImport}
            />
          </label>
        </div>
      </header>

      <section className="filters-bar">
        <div className="filters-bar__field">
          <label htmlFor="category">Productos</label>
          <select
            id="category"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">Todos los Componentes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-bar__field">
          <label htmlFor="from">Desde</label>
          <input
            id="from"
            type="date"
            value={filters.from}
            max={toInputDate(new Date())}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="filters-bar__field">
          <label htmlFor="to">Hasta</label>
          <input
            id="to"
            type="date"
            value={filters.to}
            max={toInputDate(new Date())}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <label className="filters-bar__toggle">
          <input
            type="checkbox"
            checked={includeExternal}
            onChange={(e) => setIncludeExternal(e.target.checked)}
          />
          Incluir API externa
        </label>
        <button type="button" className="btn btn--primary btn--sm" onClick={load}>
          Aplicar
        </button>
      </section>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`tab ${tab === item.id ? 'tab--active' : ''}`}
            onClick={() => selectTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <p className="notice">{message}</p>}

      {includeExternal && externalStatus && (
        <p className={`notice ${externalStatus.ok ? 'notice--ok' : ''}`}>
          {externalStatus.ok
            ? `API externa conectada: ${externalStatus.count} registros externos mezclados con los nuestros.`
            : `No se pudo obtener la API externa${
                externalStatus.error ? `: ${externalStatus.error}` : ''
              }. Se muestran solo los datos propios.`}
        </p>
      )}

      {loading ? (
        <Spinner label="Generando informes..." />
      ) : (
        <>
          {tab === 'tabular' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {includeExternal && <th>Origen</th>}
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columnCount} className="table__empty">
                        No hay ventas en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr key={`${row.invoice_id}-${row.source}-${index}`}>
                        {includeExternal && (
                          <td>
                            <span
                              className={`badge ${
                                row.source === 'external' ? 'badge--warning' : 'badge--success'
                              }`}
                            >
                              {row.source === 'external' ? 'Externo' : 'Nuestro'}
                            </span>
                          </td>
                        )}
                        <td className="row-id">{`#${String(index + 1).padStart(3, '0')}`}</td>
                        <td>{row.user_name}</td>
                        <td>{formatDate(row.date)}</td>
                        <td>{row.product_name}</td>
                        <td>{row.quantity}</td>
                        <td>{formatCurrency(row.line_total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'chart' && (
            <section className="card">
              <div className="card__header">
                <h2>Ventas Diarias ($ CLP)</h2>
                <div className="chart__toolbar">
                  <span className="muted">
                    {includeExternal ? 'Nuestro + API externa' : 'Período Seleccionado'}
                  </span>
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
                <ResponsiveContainer width="100%" height={340}>
                  {chartType === 'bar' && (
                    <BarChart data={series} margin={chartMargin}>
                      {chartGrid}
                      {chartXAxis}
                      {chartYAxis}
                      {chartTooltip}
                      {includeExternal ? (
                        <>
                          <Legend />
                          <Bar dataKey="local" name="Nuestro" fill="#1f5fdf" radius={[6, 6, 0, 0]} />
                          <Bar
                            dataKey="external"
                            name="Externo"
                            fill="#f59e0b"
                            radius={[6, 6, 0, 0]}
                          />
                        </>
                      ) : (
                        <Bar dataKey="total" fill="#1f5fdf" radius={[6, 6, 0, 0]} />
                      )}
                    </BarChart>
                  )}

                  {chartType === 'line' && (
                    <LineChart data={series} margin={chartMargin}>
                      {chartGrid}
                      {chartXAxis}
                      {chartYAxis}
                      {chartTooltip}
                      {includeExternal ? (
                        <>
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="local"
                            name="Nuestro"
                            stroke="#1f5fdf"
                            strokeWidth={2.5}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="external"
                            name="Externo"
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </>
                      ) : (
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#1f5fdf"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  )}

                  {chartType === 'area' && (
                    <AreaChart data={series} margin={chartMargin}>
                      {chartGrid}
                      {chartXAxis}
                      {chartYAxis}
                      {chartTooltip}
                      {includeExternal ? (
                        <>
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="local"
                            name="Nuestro"
                            stroke="#1f5fdf"
                            fill="#1f5fdf"
                            fillOpacity={0.25}
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="external"
                            name="Externo"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#1f5fdf"
                          fill="#1f5fdf"
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                      )}
                    </AreaChart>
                  )}

                  {chartType === 'pie' && (
                    <PieChart>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          boxShadow: '0 10px 30px rgba(15,23,42,0.12)'
                        }}
                      />
                      <Legend />
                      <Pie
                        data={series}
                        dataKey="total"
                        nameKey="label"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {series.map((point, index) => (
                          <Cell
                            key={point.period}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {tab === 'consolidated' && summary && (
            <div className="consolidated">
              {includeExternal ? (
                <div className="stats">
                  <div className="stat">
                    <span>Ingresos Nuestros</span>
                    <strong>{formatCurrency(summary.local.revenue)}</strong>
                  </div>
                  <div className="stat">
                    <span>Ingresos API Externa</span>
                    <strong>{formatCurrency(summary.external.revenue)}</strong>
                  </div>
                  <div className="stat">
                    <span>Ingresos Totales</span>
                    <strong>{formatCurrency(summary.total.revenue)}</strong>
                  </div>
                  <div className="stat">
                    <span>Registros Mezclados</span>
                    <strong>
                      {formatNumber(summary.local.rows)} + {formatNumber(summary.external.rows)}
                    </strong>
                  </div>
                </div>
              ) : (
                <>
                  <div className="stats">
                    <div className="stat">
                      <span>Ingresos</span>
                      <strong>{formatCurrency(summary.revenue)}</strong>
                    </div>
                    <div className="stat">
                      <span>Pedidos</span>
                      <strong>{formatNumber(summary.orders)}</strong>
                    </div>
                    <div className="stat">
                      <span>Unidades</span>
                      <strong>{formatNumber(summary.units)}</strong>
                    </div>
                    <div className="stat">
                      <span>Ticket promedio</span>
                      <strong>{formatCurrency(summary.avgTicket)}</strong>
                    </div>
                  </div>

                  <div className="consolidated__grid">
                    <section className="card">
                      <div className="card__header">
                        <h2>Top Productos</h2>
                      </div>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Unidades</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.topProducts.map((p) => (
                            <tr key={p.product_name}>
                              <td>{p.product_name}</td>
                              <td>{formatNumber(p.units)}</td>
                              <td>{formatCurrency(p.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>

                    <section className="card">
                      <div className="card__header">
                        <h2>Por Categoría</h2>
                      </div>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Unidades</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.byCategory.map((c) => (
                            <tr key={c.category_name}>
                              <td>{c.category_name}</td>
                              <td>{formatNumber(c.units)}</td>
                              <td>{formatCurrency(c.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
