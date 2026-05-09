import { useParams } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, Truck, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { ProductFAQ } from '../components/ProductFAQ';
import { GiftBadge } from '../components/GiftBadge';
import './ProductPage.css';

// Default FAQ items for every product — can be overridden per product in Firebase
const DEFAULT_FAQ = [
  {
    question: 'Este produto é seguro para bebês e crianças pequenas?',
    answer: 'Sim! Todos os nossos produtos passam por rigoroso controle de qualidade e possuem certificação do Inmetro, garantindo total segurança para o seu pequeno. Os materiais são atóxicos, livres de BPA e testados conforme as normas brasileiras.',
  },
  {
    question: 'Qual é o prazo de entrega para a minha região?',
    answer: 'O prazo varia de acordo com sua localização. Em capitais e regiões metropolitanas, a entrega costuma ocorrer em 3 a 5 dias úteis. Para demais localidades, pode levar de 5 a 10 dias úteis após a confirmação do pagamento.',
  },
  {
    question: 'Posso devolver ou trocar o produto caso não goste?',
    answer: 'Absolutamente! Você tem até 7 dias corridos após o recebimento para solicitar a devolução ou troca, conforme o Código de Defesa do Consumidor. Basta entrar em contato com nosso suporte e nós cuidamos de tudo sem custo extra para você.',
  },
  {
    question: 'A foto do produto é fiel ao que vou receber?',
    answer: 'Sim! Todas as fotos são tiradas do produto real, sem filtros ou edições que alterem cores ou dimensões. Você receberá exatamente o que está vendo na tela. Qualquer dúvida, entre em contato antes de comprar.',
  },
];

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

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  // Promo badge from Firebase or auto-generated from discount
  const showPromoBadge = product.promoBadge?.enabled;
  const promoBadgeText = product.promoBadge?.text ||
    (hasDiscount ? `🔥 Promoção especial – ${discountPct}% OFF! Aproveite enquanto durar.` : '');

  // Gift badge from Firebase
  const showGiftBadge = product.giftBadge?.enabled;

  // FAQ items from Firebase or fallback to defaults
  const faqItems = (product.faqItems && product.faqItems.length > 0)
    ? product.faqItems
    : DEFAULT_FAQ;

  return (
    <div className="pdp-container">
      <h1 className="pdp-title">{product.name}</h1>
      <div className="pdp-grid">
        {/* Left Column: Image Gallery */}
        <div className="pdp-gallery">
          <div className="main-image-container">
            <img src={product.images[0]} alt={product.name} className="pdp-main-image" />
          </div>

          <div className="pdp-bottom-description">
            <h2>Descrição do Produto</h2>
            <div className="pdp-description-content">
              <p>{product.description || 'Produto premium desenvolvido pensando no conforto, segurança e desenvolvimento do seu filho. Materiais de alta durabilidade com certificação do Inmetro.'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Conversion Sidebar */}
        <div className="pdp-info">


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

          {/* ── Promo Badge (effeito02) ── */}
          {showPromoBadge && promoBadgeText && (
            <div className="pdp-promo-badge">
              <div className="pdp-promo-badge__pill">Oferta</div>
              <p className="pdp-promo-badge__text">{promoBadgeText}</p>
            </div>
          )}

          <div className="pdp-price-block">
            {hasDiscount && (
              <div className="pdp-discount-row">
                <span className="pdp-original-price">
                  De: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)}
                </span>
                <span className="pdp-discount-badge">
                  -{discountPct}% OFF
                </span>
              </div>
            )}
            <div className="pdp-price">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </div>
            {hasDiscount && (
              <p className="pdp-savings">
                Você economiza {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice - product.price)} nesta compra
              </p>
            )}
          </div>

          {showGiftBadge && <GiftBadge />}

          <img src="/trust-banner.png" alt="Compra Garantida - Entrega Rápida" className="pdp-ml-trust-banner" />

          <button className="pdp-buy-btn" onClick={handleAddToCart}>
            <ShoppingCart size={22} />
            Comprar Agora
          </button>



          {/* ── FAQ Accordion (effeito01) ── */}
          <ProductFAQ items={faqItems} />
        </div>
      </div>
    </div>
  );
}
