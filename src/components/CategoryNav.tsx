import { Link } from 'react-router-dom';
import { Baby, Smile, Rocket, Puzzle, Bike, Shirt } from 'lucide-react';
import './CategoryNav.css';

const categories = [
  { slug: '0-2-anos', label: '0 a 2 anos', icon: <Baby size={40} strokeWidth={1.5} color="var(--trust-navy)" /> },
  { slug: '3-5-anos', label: '3 a 5 anos', icon: <Smile size={40} strokeWidth={1.5} color="var(--trust-navy)" /> },
  { slug: '6-8-anos', label: '6 a 8 anos', icon: <Rocket size={40} strokeWidth={1.5} color="var(--trust-navy)" /> },
  { slug: 'educativos', label: 'Educativos', icon: <Puzzle size={40} strokeWidth={1.5} color="var(--trust-navy)" /> },
  { slug: 'ao-ar-livre', label: 'Ao Ar Livre', icon: <Bike size={40} strokeWidth={1.5} color="var(--trust-navy)" /> },
  { slug: 'roupas', label: 'Roupas', icon: <Shirt size={40} strokeWidth={1.5} color="var(--trust-navy)" /> },
];

export function CategoryNav() {
  return (
    <section className="category-section">
      <h2 className="section-title">Navegue por Categoria</h2>
      <div className="category-list">
        {categories.map((cat) => (
          <Link key={cat.slug} to={`/categoria/${cat.slug}`} className="category-card">
            <div className="category-icon-wrapper">
              {cat.icon}
            </div>
            <span className="category-label">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
