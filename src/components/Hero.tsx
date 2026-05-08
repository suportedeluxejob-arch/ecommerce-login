import './Hero.css';

export function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-grid">
        <a href="/promocoes" className="hero-item hero-main">
          <img src="/hero-main.png" alt="Promoção Brinquedos Educativos" className="hero-image" />
          <div className="hero-content">
            <span className="hero-tag">Oferta Especial</span>
            <h2 className="hero-title">Desenvolvimento<br/>com Diversão</h2>
            <p className="hero-subtitle">Brinquedos em madeira com 20% OFF</p>
            <button className="hero-btn">Comprar Agora</button>
          </div>
        </a>
        
        <a href="/categoria/passeio" className="hero-item hero-side-top">
          <img src="/hero-side-1.png" alt="Carrinhos de Bebê" className="hero-image" />
          <div className="hero-content hero-content-small">
            <h3 className="hero-title-small">Passeio Seguro</h3>
            <span className="hero-link">Ver modelos &rarr;</span>
          </div>
        </a>
        
        <a href="/categoria/pelucias" className="hero-item hero-side-bottom">
          <img src="/hero-side-2.png" alt="Pelúcias" className="hero-image" />
          <div className="hero-content hero-content-small">
            <span className="hero-tag-small">Novidade</span>
            <h3 className="hero-title-small">Abraço Quentinho</h3>
            <span className="hero-link">Descubra &rarr;</span>
          </div>
        </a>
      </div>
    </section>
  );
}
