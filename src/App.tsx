import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CategoryPage } from './pages/CategoryPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminCategorias } from './pages/admin/AdminCategorias';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/CartDrawer';
import './App.css';

// Storefront layout includes Header and Footer
function StorefrontLayout() {
  return (
    <>
      <Header />
      <CartDrawer />
      <div className="store-content">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            {/* Storefront Routes */}
            <Route path="/" element={<StorefrontLayout />}>
              <Route index element={<HomePage />} />
              <Route path="produto/:id" element={<ProductPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="categoria/:slug" element={<CategoryPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="produtos" element={<AdminProducts />} />
              <Route path="pedidos" element={<AdminOrders />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="categorias" element={<AdminCategorias />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
