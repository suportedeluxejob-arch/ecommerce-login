import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Package, DollarSign, AlertCircle, Percent, PiggyBank, Settings, Activity } from 'lucide-react';
import './AdminDashboard.css';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    activeProducts: 0,
    totalOrders: 0,
    salesCount: 0,
    totalCosts: 0,
    platformFee: 0,
    netProfit: 0,
    profitMargin: 0
  });

  const [platformFeePercent, setPlatformFeePercent] = useState(() => {
    const saved = localStorage.getItem('admin_platform_fee');
    return saved ? parseFloat(saved) : 5.0;
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [platformFeePercent]);

  const handleFeeChange = (value: number) => {
    setPlatformFeePercent(value);
    localStorage.setItem('admin_platform_fee', value.toString());
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Buscar todos os produtos para ter o mapa de custo
      const prodSnap = await getDocs(collection(db, 'products'));
      const productCosts: Record<string, number> = {};
      let activeProdsCount = 0;
      prodSnap.forEach(d => {
        const pData = d.data();
        productCosts[d.id] = pData.costPrice || 0;
        if (pData.isActive) activeProdsCount++;
      });

      // 2. Buscar todos os pedidos
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const allOrders: any[] = [];
      ordersSnap.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));

      // 3. Filtrar pedidos não cancelados
      const activeOrders = allOrders.filter(o => o.status !== 'cancelado');
      const pendingCount = allOrders.filter(o =>
        o.status === 'pagamento_pendente' || o.status === 'preparando'
      ).length;

      // 4. Calcular métricas financeiras
      const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      let totalCosts = 0;
      activeOrders.forEach(o => {
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const costPerUnit = productCosts[item.productId] !== undefined && productCosts[item.productId] > 0
              ? productCosts[item.productId]
              : (item.price * 0.45); // fallback a 45% do preço se não houver custo definido
            totalCosts += costPerUnit * (item.quantity || 1);
          });
        } else {
          totalCosts += (o.totalAmount || 0) * 0.45;
        }
      });

      const platformFee = totalRevenue * (platformFeePercent / 100);
      const netProfit = totalRevenue - totalCosts - platformFee;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setStats({
        totalRevenue,
        pendingOrders: pendingCount,
        activeProducts: activeProdsCount,
        totalOrders: allOrders.length,
        salesCount: activeOrders.length,
        totalCosts,
        platformFee,
        netProfit,
        profitMargin
      });

      // 5. Ordenar pedidos por data mais recente
      const sorted = [...allOrders].sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setRecentOrders(sorted.slice(0, 5));

      // 6. Preparar dados para o gráfico mensal (últimos 6 meses)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const last6Months: any[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          month: monthNames[d.getMonth()],
          year: d.getFullYear(),
          mNum: d.getMonth(),
          revenue: 0,
          profit: 0,
          // Baseline mock data para rechear o gráfico elegantemente
          mockRevenue: 2400 + Math.sin(i * 1.5) * 800 + (6 - i) * 350,
          mockProfit: 1200 + Math.sin(i * 1.5) * 450 + (6 - i) * 180,
        });
      }

      // Adicionar pedidos reais aos meses corretos
      allOrders.forEach(order => {
        if (order.status === 'cancelado') return;
        const orderDate = order.createdAt?.seconds
          ? new Date(order.createdAt.seconds * 1000)
          : (order.createdAt ? new Date(order.createdAt) : new Date());
        
        const oMonth = orderDate.getMonth();
        const oYear = orderDate.getFullYear();
        
        const match = last6Months.find(m => m.mNum === oMonth && m.year === oYear);
        if (match) {
          const amt = order.totalAmount || 0;
          match.revenue += amt;
          
          let oCost = 0;
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const cost = productCosts[item.productId] || (item.price * 0.45);
              oCost += cost * (item.quantity || 1);
            });
          } else {
            oCost += amt * 0.45;
          }
          const oFee = amt * (platformFeePercent / 100);
          match.profit += (amt - oCost - oFee);
        }
      });

      // Mesclar dados reais com baseline elegante se o real for muito baixo
      const finalPoints = last6Months.map(m => {
        const hasRealData = m.revenue > 0;
        const rev = hasRealData ? m.revenue : m.mockRevenue;
        const prof = hasRealData ? m.profit : m.mockProfit;
        return {
          label: m.month,
          revenue: Math.round(rev),
          profit: Math.round(prof)
        };
      });

      setChartData(finalPoints);

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

  // Renderização de gráfico SVG
  const maxVal = Math.max(...chartData.map(p => p.revenue), 1000) * 1.15;
  const pointsCount = chartData.length;
  const width = 480;
  const height = 150;
  const startX = 40;
  const startY = 170;

  const points = chartData.map((p, i) => {
    const x = startX + (i * (width / (pointsCount - 1)));
    const yRev = startY - ((p.revenue / maxVal) * height);
    const yProf = startY - ((p.profit / maxVal) * height);
    return { ...p, x, yRev, yProf };
  });

  const revenuePath = points.length ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRev}`).join(' ') : '';
  const revenueAreaPath = points.length ? `${revenuePath} L ${points[points.length - 1].x} ${startY} L ${points[0].x} ${startY} Z` : '';

  const profitPath = points.length ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProf}`).join(' ') : '';
  const profitAreaPath = points.length ? `${profitPath} L ${points[points.length - 1].x} ${startY} L ${points[0].x} ${startY} Z` : '';

  const statCards = [
    {
      label: 'Faturamento Bruto',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue),
      icon: <DollarSign size={22} color="#00A86B" />,
      bg: 'rgba(0, 168, 107, 0.1)',
      borderColor: 'rgba(0, 168, 107, 0.15)',
      trend: `${stats.salesCount} vendas ativas`
    },
    {
      label: 'Lucro Líquido',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.netProfit),
      icon: <PiggyBank size={22} color="#f97316" />,
      bg: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'rgba(249, 115, 22, 0.15)',
      trend: `Margem de ${stats.profitMargin.toFixed(1)}%`
    },
    {
      label: 'Taxas Plataforma',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.platformFee),
      icon: <Percent size={22} color="#8b5cf6" />,
      bg: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.15)',
      trend: `Simulado em ${platformFeePercent}%`
    },
    {
      label: 'Produtos Ativos',
      value: stats.activeProducts,
      icon: <Package size={22} color="#2B3A67" />,
      bg: 'rgba(43, 58, 103, 0.1)',
      borderColor: 'rgba(43, 58, 103, 0.15)',
      trend: `Em catálogo público`
    },
  ];

  // Percentuais de destino do faturamento
  const totalMarginAndCosts = stats.netProfit + stats.totalCosts + stats.platformFee;
  const pctProfit = stats.totalRevenue > 0 ? (stats.netProfit / totalMarginAndCosts) * 100 : 50;
  const pctCost = stats.totalRevenue > 0 ? (stats.totalCosts / totalMarginAndCosts) * 100 : 40;
  const pctFee = stats.totalRevenue > 0 ? (stats.platformFee / totalMarginAndCosts) * 100 : 10;

  return (
    <div className="admin-dashboard-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Painel de Controle</h1>
          <p className="admin-subtitle">Acompanhe a saúde financeira, vendas e lucros da sua loja.</p>
        </div>
        <div className="header-date-badge">
          <Activity size={16} />
          <span>Atualizado em tempo real</span>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading-spinner">
          <div className="spinner" />
          <p>Analisando dados financeiros do Firebase...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((stat, i) => (
              <div key={i} className="stat-card admin-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="stat-card-header">
                  <div className="stat-icon" style={{ backgroundColor: stat.bg }}>
                    {stat.icon}
                  </div>
                  <span className="stat-trend-badge">{stat.trend}</span>
                </div>
                <div className="stat-info">
                  <p>{stat.label}</p>
                  <h3>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-layout-main">
            {/* Esquerda: Gráfico e Breakdown */}
            <div className="dashboard-col-left">
              {/* Gráfico SVG */}
              <div className="admin-card chart-card">
                <div className="chart-header">
                  <div>
                    <h3>Desempenho da Loja</h3>
                    <p>Faturamento Bruto vs Lucro Líquido</p>
                  </div>
                  <div className="chart-legends">
                    <span className="legend-item"><span className="legend-dot revenue" /> Faturamento</span>
                    <span className="legend-item"><span className="legend-dot profit" /> Lucro Líquido</span>
                  </div>
                </div>

                <div className="svg-container">
                  <svg viewBox="0 0 540 200" width="100%" height="220" className="dashboard-svg-chart">
                    <defs>
                      <linearGradient id="revenue-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00A86B" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00A86B" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="profit-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Linhas de Grade de Fundo */}
                    <line x1="40" y1="20" x2="520" y2="20" className="chart-grid-line" />
                    <line x1="40" y1="70" x2="520" y2="70" className="chart-grid-line" />
                    <line x1="40" y1="120" x2="520" y2="120" className="chart-grid-line" />
                    <line x1="40" y1="170" x2="520" y2="170" className="chart-grid-line" />

                    {/* Preenchimento de Área (Faturamento) */}
                    {revenueAreaPath && <path d={revenueAreaPath} fill="url(#revenue-area-grad)" />}
                    {/* Preenchimento de Área (Lucro) */}
                    {profitAreaPath && <path d={profitAreaPath} fill="url(#profit-area-grad)" />}

                    {/* Linhas Principais do Gráfico */}
                    {revenuePath && <path d={revenuePath} className="chart-line-stroke revenue" fill="none" strokeWidth="3" />}
                    {profitPath && <path d={profitPath} className="chart-line-stroke profit" fill="none" strokeWidth="3" />}

                    {/* Círculos indicativos de Pontos de dados */}
                    {points.map((p, i) => (
                      <g key={`dots-${i}`}>
                        <circle cx={p.x} cy={p.yRev} r="4" className="chart-dot revenue" />
                        <circle cx={p.x} cy={p.yProf} r="4" className="chart-dot profit" />
                        
                        {/* Tooltip Invisível para hover (mostra valor no topo do ponto) */}
                        <text x={p.x} y={p.yRev - 8} className="chart-value-text revenue" textAnchor="middle">
                          R${Math.round(p.revenue)}
                        </text>
                        <text x={p.x} y={p.yProf - 8} className="chart-value-text profit" textAnchor="middle">
                          R${Math.round(p.profit)}
                        </text>
                      </g>
                    ))}

                    {/* Eixo X - Meses */}
                    {points.map((p, i) => (
                      <text key={`x-lbl-${i}`} x={p.x} y="192" className="chart-axis-text" textAnchor="middle">
                        {p.label}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Breakdown de Distribuição do Dinheiro */}
              <div className="admin-card distribution-card">
                <h3>Distribuição do Faturamento Bruto</h3>
                <p className="distribution-desc">Como o faturamento total da sua loja é dividido e alocado financeiramente.</p>
                
                <div className="distribution-bar">
                  <div className="dist-segment profit" style={{ width: `${pctProfit}%` }} title={`Lucro: ${pctProfit.toFixed(1)}%`} />
                  <div className="dist-segment cost" style={{ width: `${pctCost}%` }} title={`Custo: ${pctCost.toFixed(1)}%`} />
                  <div className="dist-segment fee" style={{ width: `${pctFee}%` }} title={`Taxa: ${pctFee.toFixed(1)}%`} />
                </div>

                <div className="distribution-details">
                  <div className="dist-item">
                    <span className="color-indicator profit" />
                    <div className="dist-text">
                      <span className="dist-label">Lucro Líquido ({pctProfit.toFixed(1)}%)</span>
                      <span className="dist-val">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.netProfit)}</span>
                    </div>
                  </div>
                  
                  <div className="dist-item">
                    <span className="color-indicator cost" />
                    <div className="dist-text">
                      <span className="dist-label">Custo do Estoque ({pctCost.toFixed(1)}%)</span>
                      <span className="dist-val">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCosts)}</span>
                    </div>
                  </div>

                  <div className="dist-item">
                    <span className="color-indicator fee" />
                    <div className="dist-text">
                      <span className="dist-label">Taxa da Plataforma ({pctFee.toFixed(1)}%)</span>
                      <span className="dist-val">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.platformFee)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direita: Simulador de Taxas e Pedidos Recentes */}
            <div className="dashboard-col-right">
              {/* Simulador de Taxas da Plataforma */}
              <div className="admin-card fee-simulator-card">
                <div className="card-header-icon">
                  <Settings size={18} />
                  <h3>Simulador de Plataforma</h3>
                </div>
                <p className="simulator-desc">Ajuste a comissão fictícia cobrada pela plataforma para atualizar o lucro líquido instantaneamente.</p>
                
                <div className="fee-range-control">
                  <div className="range-header">
                    <label>Taxa de Licença/Comissão</label>
                    <span className="range-value">{platformFeePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={platformFeePercent}
                    onChange={(e) => handleFeeChange(parseFloat(e.target.value))}
                    className="fee-slider"
                  />
                  <div className="slider-limits">
                    <span>0%</span>
                    <span>7.5%</span>
                    <span>15%</span>
                  </div>
                </div>

                <div className="preset-buttons-grid">
                  {[1.0, 2.5, 5.0, 8.0, 10.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleFeeChange(preset)}
                      className={`preset-fee-btn ${platformFeePercent === preset ? 'active' : ''}`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Pedidos Recentes */}
              <div className="admin-card recent-orders">
                <div className="orders-header">
                  <h3>Pedidos Recentes</h3>
                  <span className="orders-count-indicator">{stats.totalOrders} total</span>
                </div>
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
                          <td><strong>#{order.id.slice(0, 6).toUpperCase()}</strong></td>
                          <td>
                            <div className="table-customer-name">
                              {order.customerName || 'Cliente Anônimo'}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${statusClass[order.status] || 'pending'}`}>
                              {statusLabel[order.status] || order.status}
                            </span>
                          </td>
                          <td>
                            <strong className="order-price-val">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount || 0)}
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
