import { Compass } from 'lucide-react';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="footer-logo">
            <Compass size={24} className="footer-logo-icon" />
            Bússola <span className="logo-highlight">Kids</span>
          </h2>
          <p className="footer-description">
            A melhor seleção de brinquedos educativos e itens de passeio para o seu filho. Segurança e qualidade em primeiro lugar.
          </p>
        </div>
        
        <div className="footer-links-group">
          <h4 className="footer-title">Navegação</h4>
          <ul className="footer-links">
            <li><a href="/">Início</a></li>
            <li><a href="/produtos">Todos os Produtos</a></li>
            <li><a href="/categorias">Categorias</a></li>
            <li><a href="/promocoes">Promoções</a></li>
          </ul>
        </div>
        
        <div className="footer-links-group">
          <h4 className="footer-title">Atendimento</h4>
          <ul className="footer-links">
            <li><a href="/contato">Fale Conosco</a></li>
            <li><a href="/faq">Dúvidas Frequentes</a></li>
            <li><a href="/trocas">Trocas e Devoluções</a></li>
            <li><a href="/rastreio">Rastreie seu Pedido</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Bússola Kids. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
