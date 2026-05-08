import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ProductShowcase.css';

export function ProductShowcase() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        const prods: any[] = [];
        querySnapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() });
        });
        setProducts(prods);
      } catch (error) {
        console.error("Erro ao buscar produtos da vitrine:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  return (
    <section className="showcase-section">
      <div className="showcase-header">
        <h2 className="section-title">Mais Vendidos</h2>
        <a href="/produtos" className="view-all">Ver todos &rarr;</a>
      </div>
      
      <div className="product-grid">
        {loading ? (
          <div className="loading-products">Carregando vitrine...</div>
        ) : products.length === 0 ? (
          <div className="empty-products">Nenhum produto disponível no momento.</div>
        ) : (
          products.map(product => (
            <Link to={`/produto/${product.id}`} key={product.id} className="product-card">
              <div className="product-image-container">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="product-badge badge-discount">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                )}
                {!product.originalPrice && product.tags?.includes('lancamento') && (
                  <span className="product-badge badge-new">Novo</span>
                )}
                {!product.originalPrice && product.tags?.includes('promocao') && (
                  <span className="product-badge badge-sale">Oferta</span>
                )}
                <img src={product.images?.[0]} alt={product.name} className="product-image" />
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price-row">
                  <div className="price-block">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="product-price-original">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)}
                      </span>
                    )}
                    <span className="product-price">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </span>
                  </div>
                  <button 
                    className="add-to-cart-btn" 
                    aria-label="Adicionar ao carrinho"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingCart size={20} />
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
