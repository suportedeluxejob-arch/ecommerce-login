import { Search, ShoppingCart, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Header.css';

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  return (
    <header className="header-container">
      <div className="top-bar">
        <span>Bússola Kids: A direção certa para o seu filho. | Frete Grátis acima de R$199</span>
      </div>
      
      <div className="main-header">
        <div className="logo-container">
          <Link to="/" className="logo">
            <Compass size={28} className="logo-icon" />
            Bússola <span className="logo-highlight">Kids</span>
          </Link>
        </div>

        <div className="search-container">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="O que você procura hoje?" 
              className="search-input"
            />
            <button className="search-button">
              <Search size={20} />
            </button>
          </div>
        </div>

        <div className="actions-container">
          <button className="action-button cart-button" onClick={() => setIsCartOpen(true)}>
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </div>
            <span className="action-text">Carrinho</span>
          </button>
        </div>
      </div>
    </header>
  );
}
