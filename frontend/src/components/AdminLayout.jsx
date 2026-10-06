import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const REPORT_ITEMS = [
  { id: 'tabular', label: 'Ventas Tabular', icon: '▦' },
  { id: 'chart', label: 'Ventas Gráfico', icon: '▨' },
  { id: 'consolidated', label: 'Consolidado', icon: '▣' }
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = params.get('tab') || 'tabular';
  const isReports = pathname === '/admin';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar__brand">
          <span className="brand__mark">NX</span>
          <span>NEXUS</span>
        </Link>

        <div className="admin-user">
          <span className="admin-user__avatar">{initials(user?.name)}</span>
          <span className="admin-user__meta">
            <strong>{user?.name || 'Administrador'}</strong>
            <span>Administrador</span>
          </span>
        </div>

        <nav className="admin-nav" aria-label="Administración">
          <Link
            to="/admin/productos"
            className={pathname.startsWith('/admin/productos') ? 'active' : ''}
          >
            <span className="admin-nav__icon" aria-hidden="true">▤</span>
            Productos
          </Link>

          {REPORT_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={`/admin?tab=${item.id}`}
              className={isReports && currentTab === item.id ? 'active' : ''}
            >
              <span className="admin-nav__icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <button type="button" className="admin-nav__logout" onClick={handleLogout}>
            <span className="admin-nav__icon" aria-hidden="true">⏻</span>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  );
}
