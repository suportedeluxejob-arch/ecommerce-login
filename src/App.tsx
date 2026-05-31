import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { SearchPage } from './pages/SearchPage';
import { AdminLayout } from './pages/admin/AdminLayout';
// Lazy load AdminDashboard so it doesn't crash the storefront if it has issues
import { lazy, Suspense } from 'react';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminCategorias } from './pages/admin/AdminCategorias';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminAuthProvider, useAdminAuth } from './pages/admin/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { ChatDock } from './components/ChatDock';
import './App.css';

// Storefront layout includes Header and Footer
function StorefrontLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isCheckoutPage = location.pathname === '/checkout';

  return (
    <>
      {!isCheckoutPage && <Header />}
      {!isCheckoutPage && <CartDrawer />}
      <div className="store-content">
        <Outlet />
      </div>
      {!isCheckoutPage && <Footer />}
      {isHomePage && <ChatDock />}
    </>
  );
}

// ── Admin auth guard ──────────────────────────────
// Shows a loading state while Firebase resolves the session,
// then redirects to /admin/login if not authenticated.
function AdminGuard() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a',
        color: '#94a3b8', fontSize: '1rem', gap: '12px',
        fontFamily: "'Inter', sans-serif",
      }}>
        <span style={{
          display: 'inline-block', width: 22, height: 22,
          border: '2px solid #334155', borderTopColor: '#f97316',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
        Verificando acesso...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout />;
}

function App() {
  return (
    <CartProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <div className="app-container">
            <Routes>
              {/* Storefront Routes */}
              <Route path="/" element={<StorefrontLayout />}>
                <Route index element={<HomePage />} />
                <Route path="produto/:id" element={<ProductPage />} />
                <Route path="produtos" element={<ProductsPage />} />
                <Route path="busca" element={<SearchPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="categoria/:slug" element={<CategoryPage />} />
              </Route>

              {/* Admin Login — public */}
              <Route path="/admin/login" element={<AdminLoginGate />} />

              {/* Admin Routes — protected */}
              <Route path="/admin" element={<AdminGuard />}>
                <Route index element={<Suspense fallback={<div>Loading...</div>}><AdminDashboard /></Suspense>} />
                <Route path="produtos" element={<AdminProducts />} />
                <Route path="pedidos" element={<AdminOrders />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="categorias" element={<AdminCategorias />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </AdminAuthProvider>
    </CartProvider>
  );
}

// Redirects already-logged-in admins away from the login page
function AdminLoginGate() {
  const { user, loading } = useAdminAuth();

  if (loading) return null; // Avoid flash
  if (user) return <Navigate to="/admin" replace />;
  return <AdminLogin />;
}

export default App;
