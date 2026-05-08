import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Baby, Smile, Rocket, Puzzle, Bike, Shirt, SlidersHorizontal } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import './CategoryPage.css';

const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  '0-2-anos': {
    label: '0 a 2 Anos',
    description: 'Produtos seguros e estimulantes para bebês em seus primeiros passos.',
    icon: <Baby size={48} strokeWidth={1.5} />,
  },
  '3-5-anos': {
    label: '3 a 5 Anos',
    description: 'Brinquedos que estimulam a criatividade e a imaginação na pré-escola.',
    icon: <Smile size={48} strokeWidth={1.5} />,
  },
  '6-8-anos': {
    label: '6 a 8 Anos',
    description: 'Opções que desafiam e desenvolvem habilidades na fase escolar.',
    icon: <Rocket size={48} strokeWidth={1.5} />,
  },
  'educativos': {
    label: 'Educativos',
    description: 'Aprender brincando — jogos e brinquedos que desenvolvem o potencial.',
    icon: <Puzzle size={48} strokeWidth={1.5} />,
  },
  'ao-ar-livre': {
    label: 'Ao Ar Livre',
    description: 'Movimento, saúde e diversão para crianças ativas.',
    icon: <Bike size={48} strokeWidth={1.5} />,
  },
  'roupas': {
    label: 'Roupas',
    description: 'Vestuário infantil com conforto, estilo e durabilidade.',
    icon: <Shirt size={48} strokeWidth={1.5} />,
  },
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('default');

  const meta = slug ? CATEGORY_META[slug] : null;

  useEffect(() => {
    if (!slug) return;
    fetchProducts(slug);
  }, [slug]);

  useEffect(() => {
    let sorted = [...products];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    setFiltered(sorted);
  }, [sort, products]);

  const fetchProducts = async (categorySlug: string) => {
    setLoading(true);
    try {
      // Query by category field
      const q = query(
        collection(db, 'products'),
        where('isActive', '==', true),
        where('category', '==', categorySlug)
      );
      const snap = await getDocs(q);
      const prods: any[] = [];
      snap.forEach(d => prods.push({ id: d.id, ...d.data() }));
      setProducts(prods);
      setFiltered(prods);
    } catch (error) {
      console.error('Erro ao buscar produtos da categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
    });
  };

  return (
    <div className="category-page">
      {/* Breadcrumb */}
      <div className="category-breadcrumb">
        <Link to="/" className="breadcrumb-link">
          <ArrowLeft size={16} /> Voltar à Loja
        </Link>
      </div>

      {/* Hero Banner da Categoria */}
      <div className="category-hero">
        <div className="category-hero-icon">
          {meta?.icon ?? <Puzzle size={48} strokeWidth={1.5} />}
        </div>
        <div>
          <h1 className="category-hero-title">{meta?.label ?? slug}</h1>
          <p className="category-hero-desc">{meta?.description ?? 'Explore nossa seleção.'}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="category-filter-bar">
        <span className="product-count">
          {loading ? 'Carregando...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </span>
        <div className="sort-control">
          <SlidersHorizontal size={16} />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="default">Ordenar: Relevância</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="name">Nome A–Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="category-loading">Carregando produtos...</div>
      ) : filtered.length === 0 ? (
        <div className="category-empty">
          <p>Nenhum produto encontrado nesta categoria ainda.</p>
          <p className="category-empty-hint">
            Para popular esta categoria, edite um produto no Admin e defina a categoria como <code>{slug}</code>.
          </p>
          <Link to="/" className="admin-btn primary" style={{ marginTop: 24, display: 'inline-flex', gap: 8 }}>
            Ver todos os produtos
          </Link>
        </div>
      ) : (
        <div className="category-grid">
          {filtered.map(product => (
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
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/280'}
                  alt={product.name}
                  className="product-image"
                />
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
          ))}
        </div>
      )}
    </div>
  );
}
