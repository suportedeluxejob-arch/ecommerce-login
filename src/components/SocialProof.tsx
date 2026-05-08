import { ShieldCheck, Star } from 'lucide-react';
import './SocialProof.css';

const reviews = [
  {
    id: 1,
    name: "Mariana Silva",
    text: "Comprei o carrinho de passeio e chegou super rápido. Qualidade excelente e meu bebê adorou! O atendimento pelo site foi impecável.",
    rating: 5
  },
  {
    id: 2,
    name: "Carlos Eduardo",
    text: "Os brinquedos educativos de madeira são perfeitos. Muito bem acabados e seguros. Com certeza comprarei novamente para o aniversário do meu sobrinho.",
    rating: 5
  },
  {
    id: 3,
    name: "Fernanda Costa",
    text: "Amei a experiência de compra. O site é muito fácil de usar e as fotos mostram exatamente como o produto é. A pelúcia é super macia.",
    rating: 5
  }
];

export function SocialProof() {
  return (
    <section className="social-proof-section">
      <div className="security-badges">
        <div className="badge-item">
          <ShieldCheck size={32} color="var(--cta-green)" />
          <div className="badge-text">
            <h4>Compra Segura</h4>
            <p>Seus dados estão protegidos</p>
          </div>
        </div>
        <div className="badge-item">
          <img src="https://logodownload.org/wp-content/uploads/2019/07/inmetro-logo-1.png" alt="Inmetro" className="inmetro-logo" />
          <div className="badge-text">
            <h4>Certificado Inmetro</h4>
            <p>Brinquedos aprovados e seguros</p>
          </div>
        </div>
      </div>

      <div className="reviews-container">
        <h2 className="section-title text-center">O que as mamães e papais dizem</h2>
        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="stars">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--cta-orange)" color="var(--cta-orange)" />
                ))}
              </div>
              <p className="review-text">"{review.text}"</p>
              <p className="review-author">- {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
