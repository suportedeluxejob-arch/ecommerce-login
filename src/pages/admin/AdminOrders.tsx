import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Clock, Box, Truck, CheckCircle } from 'lucide-react';
import './AdminOrders.css';

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ords: any[] = [];
      querySnapshot.forEach((doc) => {
        ords.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ords);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      fetchOrders();
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
    }
  };

  const columns = [
    { id: 'pagamento_pendente', title: 'Pendente', icon: <Clock size={18} />, color: '#f59e0b' },
    { id: 'preparando', title: 'Preparando', icon: <Box size={18} />, color: '#3b82f6' },
    { id: 'enviado', title: 'Enviado', icon: <Truck size={18} />, color: '#8b5cf6' },
    { id: 'entregue', title: 'Entregue', icon: <CheckCircle size={18} />, color: '#10b981' }
  ];

  return (
    <div className="admin-orders-page">
      <div className="admin-page-header">
        <h1 className="admin-title">Quadro de Pedidos</h1>
      </div>

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : (
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-col-header" style={{ borderTopColor: col.color }}>
                <div className="kanban-col-title">
                  <span style={{ color: col.color }}>{col.icon}</span>
                  <h3>{col.title}</h3>
                </div>
                <span className="kanban-count">
                  {orders.filter(o => o.status === col.id).length}
                </span>
              </div>
              
              <div className="kanban-items">
                {orders.filter(o => o.status === col.id).map(order => (
                  <div key={order.id} className="kanban-card">
                    <div className="kanban-card-header">
                      <strong>#{order.id.slice(0, 6)}</strong>
                      <span className="order-price">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount || 0)}
                      </span>
                    </div>
                    <p className="order-customer">{order.customerName}</p>
                    <div className="order-items-preview">
                      {order.items?.length} {order.items?.length === 1 ? 'item' : 'itens'}
                    </div>
                    
                    <div className="kanban-actions">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pagamento_pendente">Pendente</option>
                        <option value="preparando">Preparar</option>
                        <option value="enviado">Enviar</option>
                        <option value="entregue">Entregue</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
