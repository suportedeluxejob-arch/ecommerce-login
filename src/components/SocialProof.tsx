import { ShieldCheck, Star } from 'lucide-react';
import './SocialProof.css';

const testimonials = [
  {
    id: 1,
    name: "Mariana Silva",
    role: "Mãe do Enzo, 8 meses",
    text: "O carrinho de passeio chegou super rápido e bem embalado. Meu bebê ama passear nele! Qualidade incrível, vale cada centavo.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
  },
  {
    id: 2,
    name: "Fernanda Costa",
    role: "Mãe da Clara, 2 anos",
    text: "Comprei o kit berço e ficou lindo! O tecido é super macio e lavável. Chegou antes do prazo e o atendimento foi impecável.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    rating: 5,
  },
  {
    id: 3,
    name: "Patrícia Mendes",
    role: "Mãe do Théo, 1 ano",
    text: "Os brinquedos educativos são maravilhosos! Seguros, coloridos e o meu filho não larga. Recomendo demais essa loja.",
    image: "https://randomuser.me/api/portraits/women/32.jpg",
    rating: 5,
  },
  {
    id: 4,
    name: "Juliana Rocha",
    role: "Mãe gêmeos, 6 meses",
    text: "Comprei dois tapetes de atividades e os bebês amaram! O produto é exatamente como na foto, muito bem feito e seguro.",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    rating: 5,
  },
  {
    id: 5,
    name: "Carlos Eduardo",
    role: "Pai do Miguel, 3 anos",
    text: "Presentes de aniversário do meu filho: brinquedos de madeira incríveis! Muito bem acabados e certificados pelo Inmetro.",
    image: "https://randomuser.me/api/portraits/men/36.jpg",
    rating: 5,
  },
  {
    id: 6,
    name: "Ana Beatriz Lima",
    role: "Mãe da Sofia, 4 meses",
    text: "O móbile musical é lindo e ajuda muito na hora de dormir. O bebê fica hipnotizado! Entrega super rápida, chegou em 2 dias.",
    image: "https://randomuser.me/api/portraits/women/56.jpg",
    rating: 5,
  },
  {
    id: 7,
    name: "Renata Oliveira",
    role: "Mãe do Bernardo, 14 meses",
    text: "Primeira compra nessa loja e já sou fã! O andador é robusto, seguro e o meu filho deu os primeiros passos nele. Emocionante!",
    image: "https://randomuser.me/api/portraits/women/78.jpg",
    rating: 5,
  },
  {
    id: 8,
    name: "Luciana Ferreira",
    role: "Mãe da Isabella, 2 anos",
    text: "A pelúcia chegou ainda mais fofa do que nas fotos! Minha filha não dorme sem ela. Qualidade sensacional e preço justo.",
    image: "https://randomuser.me/api/portraits/women/25.jpg",
    rating: 5,
  },
  {
    id: 9,
    name: "Roberto Souza",
    role: "Pai do Arthur, 18 meses",
    text: "Comprei o cavalinho de balanço e foi o melhor investimento! Bem feito, estável e meu filho fica horas brincando. Nota 10!",
    image: "https://randomuser.me/api/portraits/men/62.jpg",
    rating: 5,
  },
];

const col1 = testimonials.slice(0, 3);
const col2 = testimonials.slice(3, 6);
const col3 = testimonials.slice(6, 9);

function TestimonialsColumn({ items, duration }: { items: typeof testimonials; duration: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="testimonials-column">
      <div
        className="testimonials-track"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((t, i) => (
          <div key={`${t.id}-${i}`} className="testimonial-card">
            <div className="tc-stars">
              {[...Array(t.rating)].map((_, idx) => (
                <Star key={idx} size={14} fill="var(--cta-orange)" color="var(--cta-orange)" />
              ))}
            </div>
            <p className="tc-text">"{t.text}"</p>
            <div className="tc-author">
              <img src={t.image} alt={t.name} className="tc-avatar" />
              <div>
                <span className="tc-name">{t.name}</span>
                <span className="tc-role">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="social-proof-section">
      {/* Badges de confiança */}
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

      {/* Header */}
      <div className="sp-header">
        <div className="sp-badge">Depoimentos</div>
        <h2 className="sp-title">O que as mamães e papais dizem</h2>
        <p className="sp-subtitle">
          Mais de <strong>2.300 famílias</strong> já confiaram em nossa loja para cuidar dos seus pequenos.
        </p>
      </div>

      {/* Colunas animadas */}
      <div className="testimonials-wrapper">
        <TestimonialsColumn items={col1} duration={20} />
        <TestimonialsColumn items={col2} duration={26} />
        <TestimonialsColumn items={col3} duration={22} />
      </div>
    </section>
  );
}
