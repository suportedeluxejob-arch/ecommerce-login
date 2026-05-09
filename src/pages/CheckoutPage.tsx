import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CreditCardForm } from '../components/CreditCardForm';
import './CheckoutPage.css';

type PaymentMethod = 'pix' | 'credit';

export function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardValid, setCardValid] = useState(false);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'credit' && !cardValid) {
      alert('Por favor, preencha todos os dados do cartão corretamente.');
      return;
    }

    alert('Compra finalizada com sucesso! Este é apenas um protótipo.');
  };

  return (
    <div className="checkout-layout">
      {/* Checkout Header */}
      <header className="checkout-header">
        <Link to="/" className="logo checkout-logo">
          <Compass size={28} className="logo-icon" />
          Bússola <span className="logo-highlight">Kids</span>
        </Link>
        <div className="secure-checkout-badge">
          <Lock size={16} />
          <span>Checkout Seguro</span>
        </div>
      </header>

      <div className="checkout-container">
        <div className="checkout-grid">

          {/* ── Form Section ── */}
          <div className="checkout-form-section">
            <h2 className="checkout-title">Finalizar Compra</h2>
            <p className="checkout-subtitle">Você está comprando como visitante. Rápido e fácil.</p>

            <form onSubmit={handleCheckoutSubmit} className="checkout-form">

              {/* 1. Dados Pessoais */}
              <div className="form-section">
                <h3>1. Dados Pessoais</h3>
                <div className="input-group">
                  <input type="text" placeholder="Nome Completo" required />
                </div>
                <div className="input-row">
                  <input type="email" placeholder="E-mail" required className="input-half" />
                  <input type="text" placeholder="CPF" required className="input-half" />
                </div>
                <div className="input-group">
                  <input type="tel" placeholder="Telefone / WhatsApp" required />
                </div>
              </div>

              {/* 2. Endereço */}
              <div className="form-section">
                <h3>2. Endereço de Entrega</h3>
                <div className="input-row">
                  <input type="text" placeholder="CEP" required className="input-third" />
                  <input type="text" placeholder="Rua / Avenida" required className="input-two-thirds" />
                </div>
                <div className="input-row">
                  <input type="text" placeholder="Número" required className="input-third" />
                  <input type="text" placeholder="Complemento" className="input-two-thirds" />
                </div>
              </div>

              {/* 3. Pagamento */}
              <div className="form-section">
                <h3>3. Pagamento</h3>

                {/* Method selector */}
                <div className="payment-methods">
                  <label
                    className={`payment-method${paymentMethod === 'pix' ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod('pix')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="pix"
                      checked={paymentMethod === 'pix'}
                      onChange={() => setPaymentMethod('pix')}
                      readOnly
                    />
                    <span>PIX (Aprovação Imediata)</span>
                  </label>

                  <label
                    className={`payment-method${paymentMethod === 'credit' ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="credit"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                      readOnly
                    />
                    <span>Cartão de Crédito (Até 12x)</span>
                  </label>
                </div>

                {/* Credit card form — animated slide-in */}
                <div className={`credit-card-panel${paymentMethod === 'credit' ? ' credit-card-panel--open' : ''}`}>
                  <CreditCardForm
                    showSubmit={false}
                    onChange={(_state, validity) => setCardValid(validity.allValid)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`finish-buy-btn${paymentMethod === 'credit' && !cardValid ? ' finish-buy-btn--disabled' : ''}`}
              >
                Concluir Pagamento
              </button>
            </form>
          </div>

          {/* ── Order Summary ── */}
          <div className="checkout-summary-section">
            <div className="summary-card">
              <h3>Resumo do Pedido</h3>

              <div className="summary-items">
                {items.length === 0 ? (
                  <p>Seu carrinho está vazio.</p>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="summary-item">
                      <img src={item.image} alt={item.name} className="summary-item-image" />
                      <div className="summary-item-details">
                        <span className="summary-item-name">{item.name}</span>
                        <span className="summary-item-qty">Qtd: {item.quantity}</span>
                      </div>
                      <span className="summary-item-price">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
                <div className="summary-row highlight">
                  <span>Frete</span>
                  <span>Grátis</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
              </div>

              <div className="trust-footer">
                <ShieldCheck size={20} className="trust-icon" />
                <p>Ambiente seguro e criptografado. Seus dados estão 100% protegidos.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
