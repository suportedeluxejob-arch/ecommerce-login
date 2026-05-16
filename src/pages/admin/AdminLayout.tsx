import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Image, LogOut, Tag, Store } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import './AdminLayout.css';

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAdminAuth();

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/produtos', icon: <Package size={20} />, label: 'Produtos' },
    { path: '/admin/pedidos', icon: <ShoppingBag size={20} />, label: 'Pedidos' },
    { path: '/admin/banners', icon: <Image size={20} />, label: 'Banners Sazonais' },
    { path: '/admin/categorias', icon: <Tag size={20} />, label: 'Categorias & Eventos' },
  ];

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do painel admin?')) {
      await logout();
    }
  };

  // Derive initials from email for the avatar
  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo-container">
          <h2 className="admin-logo">Bússola <span className="logo-highlight">Admin</span></h2>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item return-store">
            <Store size={20} />
            <span>Ver Loja</span>
          </Link>
          <button className="admin-nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <header className="admin-topbar">
          <h2>Painel de Controle</h2>
          <div className="admin-user-info">
            <div className="admin-avatar">{initials}</div>
            <div className="admin-user-details">
              <span className="admin-user-label">Administrador</span>
              <span className="admin-user-email">{user?.email}</span>
            </div>
          </div>
        </header>

        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
