import { useParams } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, Truck, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import { useGeolocation } from '../hooks/useGeolocation';
import './ProductPage.css';

export function ProductPage() {
  const { id } = useParams();
  const { addToCart, setIsCartOpen } = useCart();
  const { region, loading: geoLoading } = useGeolocation();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="product-not-found">Carregando detalhes do produto...</div>;
  }

  if (!product) {
    return <div className="product-not-found">Produto não encontrado.</div>;
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
    setIsCartOpen(true);
  };

  return (
    <div className="pdp-container">
      <div className="pdp-grid">
        {/* Left Column: Image Gallery */}
        <div className="pdp-gallery">
          <div className="main-image-container">
            <img src={product.images[0]} alt={product.name} className="pdp-main-image" />
          </div>
        </div>

        {/* Right Column: Product Info & Conversion Sidebar */}
        <div className="pdp-info">
          <h1 className="pdp-title">{product.name}</h1>
          
          <div className="pdp-rating">
            <div className="stars">
              <Star size={18} fill="var(--cta-orange)" color="var(--cta-orange)" />
              <Star size={18} fill="var(--cta-orange)" color="var(--cta-orange)" />
              <Star size={18} fill="var(--cta-orange)" color="var(--cta-orange)" />
              <Star size={18} fill="var(--cta-orange)" color="var(--cta-orange)" />
              <Star size={18} fill="var(--cta-orange)" color="var(--cta-orange)" />
            </div>
            <span className="pdp-reviews-count">(24 avaliações de clientes)</span>
          </div>

          <div className="pdp-price-block">
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="pdp-discount-row">
                <span className="pdp-original-price">
                  De: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)}
                </span>
                <span className="pdp-discount-badge">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </div>
            )}
            <div className="pdp-price">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="pdp-savings">
                Voce economiza {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice - product.price)} nesta compra
              </p>
            )}
          </div>
          
          <p className="pdp-urgency">
            <strong>Restam apenas {product.stock > 0 ? product.stock : 1} unidades</strong> no estoque. Nao perca!
          </p>

          <p className="pdp-description">
            Produto premium desenvolvido pensando no conforto, segurança e desenvolvimento do seu filho. Materiais de alta durabilidade com certificação do Inmetro. Ideal para estimular habilidades cognitivas desde cedo.
          </p>

          <div className="pdp-shipping-banner">
            <Truck className="shipping-icon" size={24} />
            <div className="shipping-text">
              <strong>Frete Grátis</strong>
              <span>
                Para compras acima de R$199 para {geoLoading ? 'a sua região...' : <strong>{region}</strong>}
              </span>
            </div>
          </div>

          <button className="pdp-buy-btn" onClick={handleAddToCart}>
            <ShoppingCart size={22} />
            Adicionar ao Carrinho
          </button>

          <div className="pdp-trust-badges">
            <div className="pdp-trust-item">
              <ShieldCheck size={24} color="var(--trust-navy)" />
              <span>Compra 100% Segura</span>
            </div>
            <div className="pdp-trust-item">
              <img src="https://logodownload.org/wp-content/uploads/2019/07/inmetro-logo-1.png" alt="Inmetro" className="inmetro-pdp-logo" />
              <span>Aprovado pelo Inmetro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
