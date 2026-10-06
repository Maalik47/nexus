import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">NX</span>
          <span className="brand__text">NEXUS</span>
        </Link>

        <nav className="navbar__links" aria-label="Principal">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/catalogo">Categorías</NavLink>
          <NavLink to="/catalogo?featured=true">Ofertas</NavLink>
          {user && !isAdmin && <NavLink to="/reporte">Reporte</NavLink>}
          <a href="#soporte">Soporte</a>
        </nav>

        <div className="navbar__actions">
          {isAdmin && (
            <Link to="/admin" className="btn btn--ghost btn--sm">
              Administración
            </Link>
          )}

          <Link to="/carrito" className="cart-link" aria-label="Carrito de compras">
            <span aria-hidden="true">🛒</span>
            {count > 0 && <span className="cart-link__badge">{count}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <span className="user-menu__name" title={user.email}>
                {user.name.split(' ')[0]}
              </span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn--primary btn--sm">
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
