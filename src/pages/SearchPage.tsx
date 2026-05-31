import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ShoppingCart, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      if (!searchTerm) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const prods: any[] = [];
        const termLower = searchTerm.toLowerCase();
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (
            data.name.toLowerCase().includes(termLower) || 
            data.description?.toLowerCase().includes(termLower) ||
            data.tags?.some((t: string) => t.toLowerCase().includes(termLower))
          ) {
            prods.push({ id: doc.id, ...data });
          }
        });
        
        setProducts(prods);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchTerm]);

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
    <div className="products-page-container">
      <div className="products-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        <h1>Resultados da Busca</h1>
        <p>Você buscou por: <strong>"{searchTerm}"</strong></p>
      </div>

      <div className="product-grid">
        {loading ? (
          <div className="loading-products">Buscando produtos...</div>
        ) : products.length === 0 ? (
          <div className="empty-products">Nenhum produto encontrado para "{searchTerm}".</div>
        ) : (
          products.map((product, index) => (
            <motion.div 
              key={product.id} 
              className="product-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => navigate(`/produto/${product.id}`)}
            >
              <div className="product-image-container">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="product-badge badge-discount">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                )}
                <img src={product.images?.[0]} alt={product.name} className="product-image" />
              </div>
              
              <div className="product-info">
                <div className="product-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="star-icon" 
                        size={14} 
                        fill={i < Math.round(product.ratingValue || 5) ? "currentColor" : "none"} 
                        color={i < Math.round(product.ratingValue || 5) ? "currentColor" : "#CBD5E1"} 
                      />
                    ))}
                  </div>
                  <span className="rating-count">
                    {(product.ratingValue || 5).toFixed(1)} ({product.reviewsCount ?? 24})
                  </span>
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
    </div>
  );
}
