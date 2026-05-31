import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  Clock,
  Box,
  Truck,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  MapPin,
  CreditCard,
  ShoppingCart,
  MessageSquare,
  QrCode
} from 'lucide-react';
import './AdminOrders.css';

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'scams'>('board');

  // Checklist states
  const [chkValueReceived, setChkValueReceived] = useState(false);
  const [chkNameMatches, setChkNameMatches] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update checklist states when selected order changes
  useEffect(() => {
    setChkValueReceived(false);
    setChkNameMatches(false);
  }, [selectedOrder]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ords: any[] = [];
      querySnapshot.forEach((doc) => {
        ords.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date (descending)
      ords.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
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
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm("⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR DEFINITIVAMENTE este registro? Isso o removerá permanentemente do banco de dados de pedidos e da contabilidade da loja.")) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        setSelectedOrder(null);
        fetchOrders();
      } catch (error) {
        console.error("Erro ao excluir pedido:", error);
        alert("Erro ao excluir o pedido.");
      }
    }
  };

  const restoreOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'pagamento_pendente'
      });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: 'pagamento_pendente' }));
      }
    } catch (error) {
      console.error("Erro ao restaurar pedido:", error);
    }
  };

  const columns = [
    { id: 'pagamento_pendente', title: 'Pendente', icon: <Clock size={18} />, color: '#f59e0b' },
    { id: 'preparando', title: 'Preparando', icon: <Box size={18} />, color: '#3b82f6' },
    { id: 'enviado', title: 'Enviado', icon: <Truck size={18} />, color: '#8b5cf6' },
    { id: 'entregue', title: 'Entregue', icon: <CheckCircle size={18} />, color: '#10b981' }
  ];

  const formatOrderDate = (createdAt: any) => {
    if (!createdAt) return 'Data Indisponível';
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return date.toLocaleString('pt-BR');
  };

  const getWhatsAppLink = (phoneStr: string, orderIdStr: string) => {
    const cleanPhone = phoneStr.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Sou da equipe de expedição da Bússola Kids. Estou entrando em contato referente ao seu pedido #${orderIdStr.slice(0, 8).toUpperCase()}.`);
    return `https://wa.me/55${cleanPhone}?text=${msg}`;
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="admin-orders-page">
      {/* Permanent Security Alert Banner (Anti-Scam) */}
      <div className="security-alert-banner">
        <div className="security-banner-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="security-banner-content">
          <h3>🚨 CENTRAL ANTIGOLPE: SISTEMA DE EXPEDIÇÃO SEGURO</h3>
          <p>
            Nunca envie nenhum produto sem antes acessar o aplicativo do seu banco (para PIX) ou gateway de pagamento (Mercado Pago/Asaas para Cartão de Crédito) e confirmar que o valor exato foi creditado em sua conta corrente. Golpistas geram comprovantes falsos e manipulam telas com facilidade.
          </p>
        </div>
      </div>

      <div className="admin-page-header">
        <h1 className="admin-title">Quadro de Pedidos</h1>
        <div className="admin-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'board' ? 'active' : ''}`}
            onClick={() => setActiveTab('board')}
          >
            <ShoppingCart size={16} />
            <span>Pedidos Ativos</span>
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'scams' ? 'active font-bold' : ''}`}
            onClick={() => setActiveTab('scams')}
            style={{ 
              backgroundColor: activeTab === 'scams' ? '#fee2e2' : undefined,
              borderColor: activeTab === 'scams' ? '#ef4444' : undefined,
              color: activeTab === 'scams' ? '#dc2626' : undefined 
            }}
          >
            <AlertTriangle size={16} />
            <span>Tentativas de Golpe ({orders.filter(o => o.status === 'golpe').length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Carregando pedidos do Firebase...</p>
        </div>
      ) : activeTab === 'board' ? (
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
                  <div 
                    key={order.id} 
                    className={`kanban-card ${order.status === 'pagamento_pendente' ? 'kanban-card--pending' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="kanban-card-header">
                      <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                      <span className="order-price">
                        {fmt(order.totalAmount || 0)}
                      </span>
                    </div>
                    <p className="order-customer">{order.customerName}</p>
                    <div className="order-meta-info">
                      <div className="order-items-preview">
                        {order.items?.length} {order.items?.length === 1 ? 'item' : 'itens'}
                      </div>
                      <div className="order-payment-method-badge">
                        {order.paymentMethod === 'pix' ? (
                          <span className="badge-pix">
                            <QrCode size={10} /> PIX
                          </span>
                        ) : (
                          <span className="badge-credit">
                            <CreditCard size={10} /> CARTÃO
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="kanban-actions" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pagamento_pendente">Pendente</option>
                        <option value="preparando">Preparar</option>
                        <option value="enviado">Enviar</option>
                        <option value="entregue">Entregue</option>
                        <option value="golpe">⚠️ Golpe / Fraude</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="scams-container">
          <div className="scams-header-info">
            <AlertTriangle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
            <p>
              Estes registros foram identificados como **tentativas de fraude ou pedidos falsos**. Eles estão arquivados separadamente para que não afetem a contabilidade e os indicadores reais de faturamento da sua loja.
            </p>
          </div>

          {orders.filter(o => o.status === 'golpe').length === 0 ? (
            <div className="empty-scams-state">
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: 16 }} />
              <h3>Nenhuma tentativa de golpe registrada!</h3>
              <p>Sua loja está operando com segurança e sem fraudes detectadas.</p>
            </div>
          ) : (
            <div className="scams-grid">
              {orders.filter(o => o.status === 'golpe').map(order => (
                <div key={order.id} className="scam-card">
                  <div className="scam-card-header">
                    <div className="scam-id-badge">
                      <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                      <span className="scam-date">{formatOrderDate(order.createdAt)}</span>
                    </div>
                    <div className="scam-amount">{fmt(order.totalAmount || 0)}</div>
                  </div>

                  <div className="scam-buyer-details">
                    <h4>{order.customerName}</h4>
                    <p><strong>E-mail:</strong> {order.customerEmail || 'Não informado'}</p>
                    <p><strong>CPF:</strong> {order.customerCPF || 'Não informado'}</p>
                    <p><strong>WhatsApp:</strong> {order.customerPhone || 'Não informado'}</p>
                  </div>

                  <div className="scam-actions">
                    {order.customerPhone && (
                      <a
                        href={getWhatsAppLink(order.customerPhone, order.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-contact-btn btn-sm"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </a>
                    )}
                    <button 
                      onClick={() => restoreOrder(order.id)} 
                      className="scam-btn-restore"
                      title="Restaurar este pedido para a fila de pendentes"
                    >
                      Restaurar Pedido
                    </button>
                    <button 
                      onClick={() => deleteOrder(order.id)} 
                      className="scam-btn-delete"
                      title="Excluir este pedido definitivamente do banco de dados"
                    >
                      Excluir Definitivo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <header className="order-modal-header">
              <div>
                <h2>Detalhes do Pedido</h2>
                <span className="order-modal-id">#{selectedOrder.id.toUpperCase()}</span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </header>

            <div className="order-modal-grid">
              {/* Left Column: Comprador, Endereço e Itens */}
              <div className="order-modal-left">
                {/* 1. Dados do Cliente */}
                <section className="modal-section">
                  <h3>
                    <User size={18} /> Dados do Comprador
                  </h3>
                  <div className="detail-cards-grid">
                    <div className="detail-card">
                      <label>Nome Completo</label>
                      <p>{selectedOrder.customerName}</p>
                    </div>
                    <div className="detail-card">
                      <label>CPF</label>
                      <p>{selectedOrder.customerCPF || 'Não informado'}</p>
                    </div>
                    <div className="detail-card">
                      <label>E-mail</label>
                      <p>{selectedOrder.customerEmail || 'Não informado'}</p>
                    </div>
                    <div className="detail-card">
                      <label>Telefone / WhatsApp</label>
                      <div className="phone-wrapper">
                        <p>{selectedOrder.customerPhone || 'Não informado'}</p>
                        {selectedOrder.customerPhone && (
                          <a
                            href={getWhatsAppLink(selectedOrder.customerPhone, selectedOrder.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-contact-btn"
                          >
                            <MessageSquare size={14} /> Chamar no WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Endereço de Entrega */}
                <section className="modal-section">
                  <h3>
                    <MapPin size={18} /> Endereço de Entrega
                  </h3>
                  <div className="address-display-box">
                    <p><strong>Logradouro:</strong> {selectedOrder.shippingAddress?.street}, Nº {selectedOrder.shippingAddress?.number}</p>
                    {selectedOrder.shippingAddress?.complement && <p><strong>Complemento:</strong> {selectedOrder.shippingAddress?.complement}</p>}
                    <p><strong>CEP:</strong> {selectedOrder.shippingAddress?.cep}</p>
                  </div>
                </section>

                {/* 3. Itens Comprados */}
                <section className="modal-section">
                  <h3>
                    <ShoppingCart size={18} /> Produtos do Pedido
                  </h3>
                  <div className="modal-items-list">
                    {selectedOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="modal-item-row">
                        <img src={item.image} alt={item.name} className="modal-item-thumb" />
                        <div className="modal-item-details">
                          <h4>{item.name}</h4>
                          {item.variant && <span className="modal-item-variant">{item.variant}</span>}
                          <span className="modal-item-qty-price">
                            {item.quantity}x {fmt(item.price)}
                          </span>
                        </div>
                        <span className="modal-item-subtotal">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="modal-total-summary">
                    <div className="modal-total-row">
                      <span>Total Geral:</span>
                      <strong>{fmt(selectedOrder.totalAmount || 0)}</strong>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Status, Anti-golpe checklist, ações */}
              <div className="order-modal-right">
                {/* 1. Status e Pagamento */}
                <section className="modal-section right-section highlight-bg">
                  <h3>Informações do Pagamento</h3>
                  <div className="payment-summary-block">
                    <div className="payment-summary-row">
                      <span>Método:</span>
                      <strong>
                        {selectedOrder.paymentMethod === 'pix' ? 'PIX' : 'CARTÃO DE CRÉDITO'}
                      </strong>
                    </div>
                    <div className="payment-summary-row">
                      <span>Data:</span>
                      <strong>{formatOrderDate(selectedOrder.createdAt)}</strong>
                    </div>
                    <div className="payment-summary-row">
                      <span>Total a Receber:</span>
                      <strong className="text-total">{fmt(selectedOrder.totalAmount || 0)}</strong>
                    </div>
                  </div>

                  <div className="modal-status-select-wrap">
                    <label>Alterar Status do Pedido:</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className="modal-status-select"
                    >
                      <option value="pagamento_pendente">Pendente de Confirmação</option>
                      <option value="preparando">Preparando Envio</option>
                      <option value="enviado">Enviado / Transportadora</option>
                      <option value="entregue">Entregue</option>
                      <option value="golpe">⚠️ Golpe / Fraude Confirmado</option>
                    </select>
                  </div>
                </section>

                {/* 2. Segurança Antigolpe */}
                <section className="modal-section right-section anti-scam-checklist-card">
                  <div className="checklist-card-header">
                    <AlertTriangle size={18} className="icon-warning" />
                    <h4>Verificação de Segurança Antigolpe</h4>
                  </div>
                  <p className="checklist-card-intro">
                    Antes de alterar o status para <strong>"Preparando"</strong> e enviar o produto, complete as verificações abaixo:
                  </p>

                  <div className="checklist-items">
                    <label className="checklist-item">
                      <input
                        type="checkbox"
                        checked={chkValueReceived}
                        onChange={(e) => setChkValueReceived(e.target.checked)}
                      />
                      <span>
                        Consultei meu extrato no aplicativo do banco/gateway de pagamento e o valor exato de <strong>{fmt(selectedOrder.totalAmount || 0)}</strong> está creditado.
                      </span>
                    </label>

                    <label className="checklist-item">
                      <input
                        type="checkbox"
                        checked={chkNameMatches}
                        onChange={(e) => setChkNameMatches(e.target.checked)}
                      />
                      <span>
                        O nome do pagador no extrato confere com os dados de <strong>{selectedOrder.customerName}</strong>.
                      </span>
                    </label>
                  </div>

                  <div className={`checklist-verdict ${chkValueReceived && chkNameMatches ? 'verdict--safe' : 'verdict--alert'}`}>
                    {chkValueReceived && chkNameMatches ? (
                      <div className="verdict-message">
                        <CheckCircle size={16} />
                        <span><strong>Seguro para envio:</strong> Transação validada por você manualmente. Pode preparar e despachar!</span>
                      </div>
                    ) : (
                      <div className="verdict-message">
                        <AlertTriangle size={16} />
                        <span><strong>ATENÇÃO BLOQUEADA:</strong> Não envie o produto enquanto não marcar todos os itens de verificação acima.</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Quick actions */}
                <div className="modal-quick-actions">
                  <button
                    className="modal-action-close-btn"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Voltar para o Quadro
                  </button>
                  <button
                    className="modal-action-delete-btn"
                    onClick={() => deleteOrder(selectedOrder.id)}
                  >
                    Excluir Permanentemente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

