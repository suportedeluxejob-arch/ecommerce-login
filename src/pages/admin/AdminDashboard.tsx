import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Package, ShoppingBag, DollarSign, AlertCircle } from 'lucide-react';
import './AdminDashboard.css';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    activeProducts: 0,
    totalOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Buscar todos os pedidos
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const allOrders: any[] = [];
      ordersSnap.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));

      // Calcular stats reais
      const pendingCount = allOrders.filter(o =>
        o.status === 'pagamento_pendente' || o.status === 'preparando'
      ).length;

      const totalRevenue = allOrders
        .filter(o => o.status !== 'cancelado')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Buscar produtos ativos
      const productsSnap = await getDocs(
        query(collection(db, 'products'), where('isActive', '==', true))
      );

      setStats({
        totalRevenue,
        pendingOrders: pendingCount,
        activeProducts: productsSnap.size,
        totalOrders: allOrders.length,
      });

      // Pegar os 5 pedidos mais recentes (ordenados por data se disponível)
      const sorted = [...allOrders].sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setRecentOrders(sorted.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    pagamento_pendente: 'Pendente',
    preparando: 'Preparando',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };

  const statusClass: Record<string, string> = {
    pagamento_pendente: 'pending',
    preparando: 'preparing',
    enviado: 'shipped',
    entregue: 'delivered',
    cancelado: 'cancelled',
  };

  const statCards = [
    {
      label: 'Receita Total',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue),
      icon: <DollarSign size={24} color="#00A86B" />,
      bg: '#e8f5e9',
    },
    {
      label: 'Pedidos em Aberto',
      value: stats.pendingOrders,
      icon: <ShoppingBag size={24} color="#FF6B35" />,
      bg: '#fff3e0',
    },
    {
      label: 'Produtos Ativos',
      value: stats.activeProducts,
      icon: <Package size={24} color="#2B3A67" />,
      bg: '#e8eaf6',
    },
    {
      label: 'Total de Pedidos',
      value: stats.totalOrders,
      icon: <ShoppingBag size={24} color="#8b5cf6" />,
      bg: '#f3e8ff',
    },
  ];

  return (
    <div>
      <h1 className="admin-title">Visão Geral</h1>

      {loading ? (
        <p className="dashboard-loading">Carregando dados do Firebase...</p>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((stat, i) => (
              <div key={i} className="stat-card admin-card">
                <div className="stat-icon" style={{ backgroundColor: stat.bg }}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-content">
            <div className="admin-card recent-orders">
              <h3>Pedidos Recentes</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        <AlertCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Nenhum pedido registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id.slice(0, 6).toUpperCase()}</td>
                        <td>{order.customerName || '—'}</td>
                        <td>
                          <span className={`status-badge ${statusClass[order.status] || 'pending'}`}>
                            {statusLabel[order.status] || order.status}
                          </span>
                        </td>
                        <td>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
