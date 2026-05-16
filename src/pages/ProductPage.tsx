import { useParams } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { ProductFAQ } from '../components/ProductFAQ';
import { GiftBadge } from '../components/GiftBadge';
import { ProductFeedback } from '../components/ProductFeedback';
import './ProductPage.css';

type VariantItem = { name: string; type: string; image?: string };

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
  useGeolocation();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selected variant per type — e.g. { Cor: "Rosa", Tamanho: "M" }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  // Which image to show as main (overridden by variant selection)
  const [mainImage, setMainImage] = useState<string>('');

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setProduct(data);
          setMainImage(data.images?.[0] || '');
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

  // ── Variants logic ──
  const variants: VariantItem[] = product.variants || [];

  // Group variants by type: { Cor: [{name:"Rosa", image?:...}, ...], Tamanho: [...] }
  const variantGroups = variants.reduce<Record<string, VariantItem[]>>((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {});

  const variantTypes = Object.keys(variantGroups);
  const hasVariants = variantTypes.length > 0;

  const handleVariantSelect = (type: string, variantName: string, variantImage?: string) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variantName }));
    // If this variant has its own image, switch the main image
    if (variantImage) {
      setMainImage(variantImage);
    }
  };

  // Build a readable variant string for the cart, e.g. "Rosa | M"
  const selectedVariantLabel = variantTypes
    .map(type => selectedVariants[type])
    .filter(Boolean)
    .join(' | ');

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: mainImage || product.images[0],
      variant: selectedVariantLabel || undefined,
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
            <img src={mainImage || product.images[0]} alt={product.name} className="pdp-main-image" />
          </div>

          {/* Thumbnail strip — clicking a thumbnail resets to that image */}
          {product.images && product.images.length > 1 && (
            <div className="pdp-thumbnails">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  className={`pdp-thumb-btn ${mainImage === img ? 'active' : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} alt={`Foto ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          <ProductFeedback productId={product.id} />

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

          {/* ── Variants Selector ── */}
          {hasVariants && (
            <div className="pdp-variants">
              {variantTypes.map(type => (
                <div key={type} className="pdp-variant-group">
                  <div className="pdp-variant-label">
                    <span className="pdp-variant-type">{type}:</span>
                    {selectedVariants[type] && (
                      <span className="pdp-variant-selected">{selectedVariants[type]}</span>
                    )}
                  </div>
                  <div className="pdp-variant-options">
                    {variantGroups[type].map((v) => {
                      const isSelected = selectedVariants[type] === v.name;
                      return (
                        <button
                          key={v.name}
                          type="button"
                          className={`pdp-variant-btn ${isSelected ? 'selected' : ''} ${v.image ? 'has-image' : ''}`}
                          onClick={() => handleVariantSelect(type, v.name, v.image)}
                          title={v.name}
                        >
                          {v.image ? (
                            <img src={v.image} alt={v.name} className="pdp-variant-img" />
                          ) : (
                            v.name
                          )}
                          {v.image && <span className="pdp-variant-img-label">{v.name}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

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
