import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import './ProductsPage.css';

export function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('relevance');
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const prods: any[] = [];
        snapshot.forEach(doc => prods.push({ id: doc.id, ...doc.data() }));
        
        if (sortOption === 'price-asc') prods.sort((a, b) => a.price - b.price);
        if (sortOption === 'price-desc') prods.sort((a, b) => b.price - a.price);
        if (sortOption === 'newest') prods.reverse();

        setProducts(prods);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [sortOption]);

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
      <div className="products-header">
        <h1>Todos os Produtos</h1>
        <div className="sort-container">
          <label htmlFor="sort">Ordenar por:</label>
          <select id="sort" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="relevance">Relevância</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="newest">Lançamentos</option>
          </select>
        </div>
      </div>

      <div className="product-grid">
        {loading ? (
          <div className="loading-products">Carregando catálogo...</div>
        ) : products.length === 0 ? (
          <div className="empty-products">Nenhum produto disponível no momento.</div>
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
                {!product.originalPrice && product.tags?.includes('lancamento') && (
                  <span className="product-badge badge-new">Novo</span>
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
