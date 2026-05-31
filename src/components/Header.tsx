import { Search, ShoppingCart, Compass, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Header.css';

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        const cats: any[] = [];
        snapshot.forEach(doc => cats.push({ id: doc.id, ...doc.data() }));
        // Optional: sort by a sortOrder field or alphabetically if desired
        setCategories(cats);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="header-container">
      <div className="top-bar">
        <span>Bússola Kids: A direção certa para o seu filho. | Frete Grátis para todo o Brasil</span>
      </div>
      
      <div className="main-header">
        <div className="logo-container">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <Link to="/" className="logo">
            <Compass size={28} className="logo-icon" />
            Bússola <span className="logo-highlight">Kids</span>
          </Link>
        </div>

        <div className="search-container">
          <form className="search-box" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="O que você procura hoje?" 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-button">
              <Search size={20} />
            </button>
          </form>
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Navigation Bar */}
      <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
          <X size={24} />
        </button>
        <div className="mobile-nav-header">Categorias</div>
        <div className="header-nav-inner">
          <ul className="nav-list">
            <li><Link to="/produtos" onClick={() => setIsMobileMenuOpen(false)}>Todos os Produtos</Link></li>
            {categories.map(cat => (
              <li key={cat.id}>
                <Link to={`/categoria/${cat.slug}`} onClick={() => setIsMobileMenuOpen(false)}>
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
