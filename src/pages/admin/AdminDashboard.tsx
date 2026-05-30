import { useState, useEffect, useMemo, memo } from 'react';
import type { FC } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { DollarSign, Repeat2, TrendingUp, Clock, BarChart } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import './AdminDashboard.css';

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  description?: string;
  valueClassName?: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, unit = '', icon, description, valueClassName }) => (
  <div className="rt-card metric-card">
    <div className="rt-card-header">
      <h3 className="rt-card-title">{title}</h3>
      <div className="rt-card-icon">{icon}</div>
    </div>
    <div className="rt-card-content">
      <div className={`rt-metric-value ${valueClassName || ''}`}>
        {unit}{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
      </div>
      {description && <p className="rt-metric-desc">{description}</p>}
    </div>
  </div>
);

interface SaleDataPoint {
  time: string;
  sales: number;
  revenue: number;
}

interface LatestPayment {
  id: string;
  amount: number;
  product: string;
  customer: string;
  time: string;
  timestamp: number;
}

interface RealtimeChartProps {
  data: SaleDataPoint[];
  title: string;
  dataKey: keyof SaleDataPoint;
  lineColor: string;
  tooltipFormatter?: (value: number) => string;
  legendName: string;
}

const RealtimeChart: FC<RealtimeChartProps> = memo(({ data, title, dataKey, lineColor, tooltipFormatter, legendName }) => {
  const chartKey = useMemo(() => `chart-${title}-${dataKey}`, [title, dataKey]);

  return (
    <div className="rt-card chart-card">
      <div className="rt-card-header">
        <h3 className="rt-card-title">
          <BarChart className="chart-title-icon" /> {title}
        </h3>
      </div>
      <div className="rt-card-content">
        <div className="rt-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              key={chartKey}
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                interval="preserveStartEnd"
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={tooltipFormatter || ((value) => value.toString())}
              />
              <RechartsTooltip 
                cursor={{ stroke: lineColor, strokeWidth: 1 }}
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  borderColor: '#d1d5db',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={tooltipFormatter ? (value: any) => {
                  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                  return [tooltipFormatter(numValue), legendName];
                } : undefined}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={lineColor} 
                strokeWidth={2} 
                dot={true} 
                name={legendName}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

export function AdminDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [averageSale, setAverageSale] = useState(0);
  const [salesChartData, setSalesChartData] = useState<SaleDataPoint[]>([]);
  const [cumulativeRevenueData, setCumulativeRevenueData] = useState<SaleDataPoint[]>([]);
  const [latestPayments, setLatestPayments] = useState<LatestPayment[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders: any[] = [];
      snapshot.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));

      // Filtrar apenas pedidos ativos/pagos para o dashboard de vendas
      const activeOrders = allOrders.filter(o => o.status !== 'cancelado');
      
      const rev = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setTotalRevenue(rev);
      setSalesCount(activeOrders.length);
      setAverageSale(activeOrders.length > 0 ? rev / activeOrders.length : 0);

      // Últimos pagamentos
      const latest = activeOrders.slice(0, 10).map(o => {
        const timeDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
        const itemsNames = o.items && o.items.length > 0 
          ? o.items.map((i: any) => i.name).join(', ') 
          : 'Produto Customizado';
          
        return {
          id: o.id,
          amount: o.totalAmount || 0,
          product: itemsNames,
          customer: o.customerName || 'Cliente Anônimo',
          time: timeDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          timestamp: timeDate.getTime()
        };
      });
      setLatestPayments(latest);

      // Processar dados do gráfico (Agrupar por hora nas últimas 24h ou últimos 30 min)
      // Vamos agrupar os pedidos por hora do dia de hoje para um gráfico bonito.
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const todaysOrders = activeOrders.filter(o => {
        const orderDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
        return orderDate >= today;
      });

      // Agrupar por hora (0 a 23)
      const hourlyData: Record<number, { sales: number, revenue: number }> = {};
      for(let i=0; i<24; i++) {
        hourlyData[i] = { sales: 0, revenue: 0 };
      }

      todaysOrders.forEach(o => {
        const orderDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
        const hour = orderDate.getHours();
        hourlyData[hour].sales += 1;
        hourlyData[hour].revenue += (o.totalAmount || 0);
      });

      const currentHour = new Date().getHours();
      const chartPoints: SaleDataPoint[] = [];
      let runningRevenue = 0;
      const cumulativePoints: SaleDataPoint[] = [];

      // Mostrar do começo do dia até a hora atual
      for(let i=0; i<=currentHour; i++) {
        const timeStr = `${i.toString().padStart(2, '0')}:00`;
        chartPoints.push({
          time: timeStr,
          sales: hourlyData[i].sales,
          revenue: hourlyData[i].revenue
        });

        runningRevenue += hourlyData[i].revenue;
        cumulativePoints.push({
          time: timeStr,
          sales: hourlyData[i].sales, // Not used in this chart usually, but kept for type
          revenue: runningRevenue
        });
      }

      setSalesChartData(chartPoints);
      setCumulativeRevenueData(cumulativePoints);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="rt-dashboard-container">
      <div className="rt-header">
        <h1 className="rt-title">Rastreador de Vendas em Tempo Real</h1>
        <p className="rt-subtitle">Acompanhamento instantâneo do desempenho da sua loja (Hoje).</p>
      </div>

      <div className="rt-metrics-grid">
        <MetricCard
          title="Faturamento (Hoje)"
          value={totalRevenue}
          unit="R$ "
          icon={<DollarSign className="rt-icon text-muted" />}
          description="Faturamento acumulado do período"
          valueClassName="text-emerald"
        />
        <MetricCard
          title="Transações (Hoje)"
          value={salesCount}
          icon={<Repeat2 className="rt-icon text-muted" />}
          description="Número de vendas registradas"
        />
        <MetricCard
          title="Ticket Médio"
          value={averageSale}
          unit="R$ "
          icon={<TrendingUp className="rt-icon text-muted" />}
          description="Valor médio por transação"
          valueClassName="text-blue"
        />
        <div className="rt-card metric-card">
          <div className="rt-card-header">
            <h3 className="rt-card-title">Status da Conexão</h3>
            <Clock className="rt-icon text-muted animate-pulse" />
          </div>
          <div className="rt-card-content">
            <div className="rt-metric-value flex-center gap-2">
              <span className="live-indicator">
                <span className="live-ping"></span>
                <span className="live-dot"></span>
              </span>
              AO VIVO
            </div>
            <p className="rt-metric-desc">Dados transmitidos em tempo real via Firebase</p>
          </div>
        </div>
      </div>

      <div className="rt-charts-flex">
        <RealtimeChart
          data={salesChartData}
          title="Vendas por Hora"
          dataKey="revenue"
          lineColor="#3b82f6"
          tooltipFormatter={formatCurrency}
          legendName="Faturamento"
        />
        <RealtimeChart
          data={cumulativeRevenueData}
          title="Faturamento Acumulado (Hoje)"
          dataKey="revenue"
          lineColor="#8b5cf6"
          tooltipFormatter={formatCurrency}
          legendName="Acumulado"
        />
      </div>

      <div className="rt-card full-width-card">
        <div className="rt-card-header no-pb">
          <div>
            <h3 className="rt-card-title flex-center gap-2">
              <DollarSign className="rt-icon text-primary" /> Últimos Pagamentos
            </h3>
            <p className="rt-card-desc">Transações recentes concluídas, atualizadas ao vivo.</p>
          </div>
        </div>
        <div className="rt-card-content p-0">
          <div className="rt-scroll-area">
            <div className="rt-list">
              {latestPayments.length === 0 ? (
                <p className="rt-empty-state">Nenhum pagamento registrado ainda...</p>
              ) : (
                latestPayments.map((payment) => (
                  <div key={payment.id} className="rt-list-item">
                    <div className="rt-list-item-left">
                      <span className="rt-list-amount">{formatCurrency(payment.amount)}</span>
                      <span className="rt-list-desc">{payment.product} por {payment.customer}</span>
                    </div>
                    <div className="rt-list-item-right">
                      <span className="rt-list-time">{payment.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="rt-card-footer">
          <p>Exibindo as 10 transações mais recentes.</p>
        </div>
      </div>
    </div>
  );
}
