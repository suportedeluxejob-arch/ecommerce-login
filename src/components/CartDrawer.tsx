import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, totalPrice } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)} />
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2>Seu Carrinho</h2>
          <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-drawer-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={48} color="var(--text-light)" />
              <p>Seu carrinho está vazio.</p>
              <button className="continue-shopping-btn" onClick={() => setIsCartOpen(false)}>
                Continuar Comprando
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="drawer-item">
                <img src={item.image} alt={item.name} className="drawer-item-img" />
                <div className="drawer-item-info">
                  <h4>{item.name}</h4>
                  <span className="drawer-item-price">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                  </span>
                  
                  <div className="drawer-item-actions">
                    <div className="qty-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="drawer-subtotal">
              <span>Subtotal:</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
            </div>
            <p className="drawer-shipping-note">Frete calculado no checkout.</p>
            <button className="drawer-checkout-btn" onClick={handleCheckout}>
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
