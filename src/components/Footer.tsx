import { Compass } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand-centered">
          <h2 className="footer-logo">
            <Compass size={28} className="footer-logo-icon" />
            Bússola <span className="logo-highlight">Kids</span>
          </h2>
          <p className="footer-description">
            A melhor seleção de brinquedos educativos e itens de passeio para o seu filho. Segurança e qualidade em primeiro lugar.
          </p>
          <a href="https://wa.me/5521964579176" target="_blank" rel="noopener noreferrer" className="footer-wpp-btn">
            <FaWhatsapp size={20} />
            Falar com Suporte
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Bússola Kids. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
