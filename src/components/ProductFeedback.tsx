import { useState } from 'react';
import './ProductFeedback.css';

interface ProductFeedbackProps {
  productId: string;
}

export function ProductFeedback({ productId }: ProductFeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const ratingData = [
    { emoji: "😔", label: "Péssimo", value: 1 },
    { emoji: "😕", label: "Ruim", value: 2 },
    { emoji: "😐", label: "Regular", value: 3 },
    { emoji: "🙂", label: "Bom", value: 4 },
    { emoji: "😍", label: "Incrível", value: 5 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de salvamento
    console.log(`Feedback para ${productId}: Nota ${rating}, Comentário: ${comment}`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pf-success">
        <p>✨ Obrigado pelo seu feedback! Ele ajuda outros pais a escolherem o melhor para seus filhos.</p>
      </div>
    );
  }

  return (
    <div className="pf-container">
      <h3 className="pf-title">Como foi sua experiência com este produto?</h3>
      
      <div className="pf-rating-row">
        {ratingData.map((item) => {
          const isActive = rating === item.value;
          const isHover = isHovered === item.value;
          
          return (
            <button
              key={item.value}
              className={`pf-rating-btn ${isActive ? 'pf-rating-btn--active' : ''}`}
              onMouseEnter={() => setIsHovered(item.value)}
              onMouseLeave={() => setIsHovered(null)}
              onClick={() => setRating(item.value)}
              type="button"
              aria-label={item.label}
            >
              <div className="pf-emoji-wrapper">
                <span className={`pf-emoji ${(rating > 0 && !isActive && !isHover) ? 'pf-emoji--dimmed' : ''}`}>
                  {item.emoji}
                </span>
              </div>
              <span className="pf-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {rating > 0 && (
        <form className="pf-form" onSubmit={handleSubmit}>
          <textarea
            className="pf-textarea"
            placeholder="Conte-nos o que achou... Seu feedback é muito importante para nós!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <button type="submit" className="pf-submit-btn">
            Publicar Experiência
          </button>
        </form>
      )}
    </div>
  );
}
