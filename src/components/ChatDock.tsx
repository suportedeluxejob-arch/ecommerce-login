import { useState, useRef, useEffect, useCallback } from 'react';
import './ChatDock.css';

/* ─── Characters ─────────────────────────────────────── */
interface Character {
  id: string;
  emoji: string;
  name: string;
  color: string;         // bubble gradient start
  colorEnd: string;      // gradient end
  borderColor: string;   // online dot / highlight
  greeting: string;
}

const CHARACTERS: Character[] = [
  {
    id: 'fada',
    emoji: '🧚',
    name: 'Fada Encantada',
    color: '#fce4ec',
    colorEnd: '#fdf2f8',
    borderColor: '#f48fb1',
    greeting: '✨ Oi! Sou a Fada da Bússola Kids. Qual produto você está buscando? Me conta a idade da criança e eu indico o melhor! 🎁',
  },
  {
    id: 'uni',
    emoji: '🦄',
    name: 'Uni o Unicórnio',
    color: '#ede7f6',
    colorEnd: '#f3e8ff',
    borderColor: '#9c27b0',
    greeting: '🌈 Olá! Sou o Uni. Me diz a faixinha de idade do seu pequeno e eu mostro as melhores opções da loja! 🍼',
  },
  {
    id: 'zico',
    emoji: '🐵',
    name: 'Zico o Macaquinho',
    color: '#fff8e1',
    colorEnd: '#fffde7',
    borderColor: '#ffc107',
    greeting: '🍌 Eii! Sou o Zico. Está procurando brinquedo educativo, pelúcia ou item de bebê? Me fala e eu te ajudo a escolher! 🎮',
  },
];

/* ─── Types ───────────────────────────────────────────── */
interface Message {
  from: 'bot' | 'user';
  text: string;
}

/* ─── Component ───────────────────────────────────────── */
export function ChatDock() {
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to bottom on new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* Focus input when chat opens */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Select character ── */
  const selectCharacter = useCallback((char: Character) => {
    if (activeChar?.id === char.id && isOpen) {
      setIsOpen(false);
      return;
    }
    setActiveChar(char);
    setMessages([{ from: 'bot', text: char.greeting }]);
    setInput('');
    setIsOpen(true);
  }, [activeChar, isOpen]);

  /* ── Bot "typing" simulation ── */
  const botReply = useCallback((userText: string) => {
    setTyping(true);
    const lower = userText.toLowerCase();

    // Simple keyword-based replies for conversion
    let reply = '';

    if (lower.match(/preço|valor|quanto|caro|barato|desconto|promo/)) {
      reply = `Temos produtos com até 47% OFF. Navegue pela loja e veja as etiquetas de desconto! 🏷️`;
    } else if (lower.match(/frete|entrega|prazo|envio/)) {
      reply = `Frete grátis para todo o Brasil. Capitais: 3–5 dias úteis. Interior: 5–10 dias. 🚚`;
    } else if (lower.match(/beb[eê]|0 a 1|0-1|newborn/)) {
      reply = `Para bebês de 0 a 1 ano: móbiles, tapetes de atividades e chocalhos são os queridinhos — todos com Inmetro. 👶`;
    } else if (lower.match(/2 ano|3 ano|4 ano|toddler/)) {
      reply = `Para 2–4 anos: brinquedos educativos de madeira e cavalinhos de balanço são os mais vendidos! 🧩`;
    } else if (lower.match(/presente|aniversário|natal|dia das criança/)) {
      reply = `Qual a idade da criança? Assim te indico o presente certo! 🎁`;
    } else if (lower.match(/seguro|inmetro|tóxico|material/)) {
      reply = `Todos os produtos têm certificação Inmetro, materiais atóxicos e livres de BPA. ✅`;
    } else if (lower.match(/troca|devolução|devolver|garantia/)) {
      reply = `7 dias para troca ou devolução após o recebimento, sem custo. ↩️`;
    } else if (lower.match(/pelúcia|ursinho|boneca/)) {
      reply = `Nossas pelúcias são macias, laváveis e fofíssimas! Ver na loja 🧸`;
    } else if (lower.match(/carrinho|andador|berço|móbile/)) {
      reply = `Produto muito amado aqui! Clique nele na loja para ver detalhes e adicionar ao carrinho. 🛒`;
    } else if (lower.match(/oi|olá|ola|bom dia|boa tarde|boa noite|hey/)) {
      reply = `Olá! O que você está procurando hoje? 😊`;
    } else {
      reply = `Navega pela loja e me chama se tiver dúvida — estou aqui! 😊`;
    }

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, 1200 + Math.random() * 600);
  }, []);

  /* ── Send message ── */
  const handleSend = useCallback(() => {
    if (!input.trim() || !activeChar) return;
    const userMsg: Message = { from: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    botReply(userMsg.text);
  }, [input, activeChar, botReply]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div className="cd-root" ref={dockRef}>

      {/* ── Chat Window ── */}
      <div
        className={`cd-window${isOpen ? ' cd-window--open' : ''}`}
        style={activeChar ? {
          '--cd-grad-start': activeChar.color,
          '--cd-grad-end': activeChar.colorEnd,
          '--cd-accent': activeChar.borderColor,
        } as React.CSSProperties : {}}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        {activeChar && (
          <div className="cd-header">
            <div className="cd-header__avatar">{activeChar.emoji}</div>
            <div className="cd-header__info">
              <span className="cd-header__name">{activeChar.name}</span>
              <span className="cd-header__status">
                <span className="cd-online-dot" />
                Online agora
              </span>
            </div>
            <button
              className="cd-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="cd-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`cd-bubble cd-bubble--${msg.from}`}>
              {msg.from === 'bot' && (
                <span className="cd-bubble__avatar">{activeChar?.emoji}</span>
              )}
              <div className="cd-bubble__text">
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
            </div>
          ))}
          {typing && (
            <div className="cd-bubble cd-bubble--bot">
              <span className="cd-bubble__avatar">{activeChar?.emoji}</span>
              <div className="cd-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="cd-input-row">
          <input
            ref={inputRef}
            className="cd-input"
            placeholder="Escreva sua mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={typing}
            aria-label="Digite sua mensagem"
          />
          <button
            className="cd-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || typing}
            aria-label="Enviar mensagem"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Dock Bar ── */}
      <div className="cd-dock">
        {CHARACTERS.map(char => (
          <button
            key={char.id}
            className={`cd-char-btn${activeChar?.id === char.id && isOpen ? ' cd-char-btn--active' : ''}`}
            style={{ '--char-color': char.borderColor } as React.CSSProperties}
            onClick={() => selectCharacter(char)}
            title={char.name}
            aria-label={`Conversar com ${char.name}`}
          >
            <span className="cd-char-emoji">{char.emoji}</span>
            <span className="cd-char-dot" />
            <span className="cd-char-name">{char.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
