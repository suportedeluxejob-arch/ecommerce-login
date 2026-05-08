import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Image, LogOut, Tag } from 'lucide-react';
import './AdminLayout.css';

export function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/produtos', icon: <Package size={20} />, label: 'Produtos' },
    { path: '/admin/pedidos', icon: <ShoppingBag size={20} />, label: 'Pedidos' },
    { path: '/admin/banners', icon: <Image size={20} />, label: 'Banners Sazonais' },
    { path: '/admin/categorias', icon: <Tag size={20} />, label: 'Categorias & Eventos' },
  ];

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
            <LogOut size={20} />
            <span>Voltar à Loja</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <header className="admin-topbar">
          <h2>Painel de Controle</h2>
          <div className="admin-user-info">
            <div className="admin-avatar">AD</div>
            <span>Admin</span>
          </div>
        </header>

        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
