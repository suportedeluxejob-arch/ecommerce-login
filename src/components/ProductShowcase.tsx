import { ShoppingCart, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { motion } from 'framer-motion';
import './ProductShowcase.css';

export function ProductShowcase() {
  const { addToCart, setIsCartOpen } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
    setIsCartOpen(true);
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
          products.map((product, index) => (
            <motion.div 
              key={product.id} 
              className="product-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: "easeInOut" }}
              onClick={() => navigate(`/produto/${product.id}`)}
            >
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
                <div className="product-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="star-icon" size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="rating-count">5.0 (24)</span>
                </div>
                
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
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="add-to-cart-btn-full" 
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingCart size={18} className="btn-icon" />
                  <span>Adicionar</span>
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
