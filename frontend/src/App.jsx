import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import MyReport from './pages/MyReport.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminInventory from './pages/admin/AdminInventory.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';

function NotFound() {
  return (
    <div className="page page--narrow empty">
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/" className="btn btn--primary">Volver al inicio</Link>
    </div>
  );
}

function Admin({ children }) {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdmin && <Navbar />}
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reporte"
            element={
              <ProtectedRoute>
                <MyReport />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Admin><AdminReports /></Admin>} />
          <Route path="/admin/productos" element={<Admin><AdminProducts /></Admin>} />
          <Route path="/admin/inventario" element={<Admin><AdminInventory /></Admin>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}
