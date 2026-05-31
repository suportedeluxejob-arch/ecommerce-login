import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Lock, QrCode, Loader2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './CheckoutPage.css';

type OrderStatus = 'typing' | 'processing' | 'pix-pending' | 'verifying-pix' | 'success';

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('typing');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');

  const [hasAutofilled, setHasAutofilled] = useState(false);

  // Exclusively PIX with 5% discount
  const pixDiscount = totalPrice * 0.05;
  const finalTotal = totalPrice - pixDiscount;

  // Fixed static Pix code
  const pixCode = '00020126360014BR.GOV.BCB.PIX0114+55219922498125204000053039865802BR5925Guilherme Vinicius Belo d6009SAO PAULO62140510kMJZjFz7PM63041D2D';

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Dynamic input formatters
  const formatCPF = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  const formatCEP = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 5) return nums;
    return `${nums.slice(0, 5)}-${nums.slice(5)}`;
  };

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return nums.length > 0 ? `(${nums}` : '';
    if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  // Strategic Auto-Fill on mount (LocalStorage + URL params)
  useEffect(() => {
    let autofillTriggered = false;

    // 1. Try to read from localStorage first
    try {
      const savedLead = localStorage.getItem('bussolakids_lead_info');
      if (savedLead) {
        const leadData = JSON.parse(savedLead);
        if (leadData.name) setName(leadData.name);
        if (leadData.email) setEmail(leadData.email);
        if (leadData.cpf) setCpf(leadData.cpf);
        if (leadData.phone) setPhone(leadData.phone);
        if (leadData.cep) setCep(leadData.cep);
        if (leadData.street) setStreet(leadData.street);
        if (leadData.number) setNumber(leadData.number);
        if (leadData.complement) setComplement(leadData.complement);
        autofillTriggered = true;
      }
    } catch (e) {
      console.error('Erro ao ler lead do localStorage:', e);
    }

    // 2. Read and override from URL query parameters (Funnel / Marketing integration)
    const params = new URLSearchParams(window.location.search);
    const urlNome = params.get('nome') || params.get('name');
    const urlEmail = params.get('email');
    const urlCpf = params.get('cpf');
    const urlTel = params.get('tel') || params.get('phone');
    const urlCep = params.get('cep');
    const urlRua = params.get('rua') || params.get('street');
    const urlNum = params.get('numero') || params.get('number');
    const urlComp = params.get('complemento') || params.get('complement');

    if (urlNome) { setName(decodeURIComponent(urlNome)); autofillTriggered = true; }
    if (urlEmail) { setEmail(decodeURIComponent(urlEmail)); autofillTriggered = true; }
    if (urlCpf) { setCpf(formatCPF(decodeURIComponent(urlCpf))); autofillTriggered = true; }
    if (urlTel) { setPhone(formatPhone(decodeURIComponent(urlTel))); autofillTriggered = true; }
    if (urlCep) {
      const formattedCep = formatCEP(decodeURIComponent(urlCep));
      setCep(formattedCep);
      autofillTriggered = true;

      // Automatically query ViaCEP if CEP is in URL parameters
      const cleanCep = formattedCep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
          .then(res => res.json())
          .then(data => {
            if (!data.erro) {
              setStreet(data.logradouro || '');
            }
          })
          .catch(err => console.error('Erro ao buscar ViaCEP da URL:', err));
      }
    }
    if (urlRua) { setStreet(decodeURIComponent(urlRua)); autofillTriggered = true; }
    if (urlNum) { setNumber(decodeURIComponent(urlNum)); autofillTriggered = true; }
    if (urlComp) { setComplement(decodeURIComponent(urlComp)); autofillTriggered = true; }

    if (autofillTriggered) {
      setHasAutofilled(true);
    }
  }, []);

  // Update localStorage cache and fields dynamically
  const handleFieldChange = (field: string, val: string) => {
    let formattedVal = val;
    if (field === 'cpf') {
      formattedVal = formatCPF(val);
      setCpf(formattedVal);
    } else if (field === 'cep') {
      formattedVal = formatCEP(val);
      setCep(formattedVal);

      // Fetch ViaCEP
      const cleanCep = formattedVal.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
          .then(res => res.json())
          .then(data => {
            if (!data.erro) {
              setStreet(data.logradouro || '');
              const nextInput = document.getElementById('checkout-number');
              if (nextInput) nextInput.focus();
            }
          })
          .catch(err => console.error('Erro ViaCEP:', err));
      }
    } else if (field === 'phone') {
      formattedVal = formatPhone(val);
      setPhone(formattedVal);
    } else {
      if (field === 'name') setName(val);
      else if (field === 'email') setEmail(val);
      else if (field === 'street') setStreet(val);
      else if (field === 'number') setNumber(val);
      else if (field === 'complement') setComplement(val);
    }

    // Save lead details to localStorage for cache auto-filling
    try {
      const currentLead = {
        name: field === 'name' ? val : name,
        email: field === 'email' ? val : email,
        cpf: field === 'cpf' ? formattedVal : cpf,
        phone: field === 'phone' ? formattedVal : phone,
        cep: field === 'cep' ? formattedVal : cep,
        street: field === 'street' ? val : street,
        number: field === 'number' ? val : number,
        complement: field === 'complement' ? val : complement,
      };
      localStorage.setItem('bussolakids_lead_info', JSON.stringify(currentLead));
    } catch (e) {
      console.error(e);
    }
  };

  // Create order in Firestore (always PIX with 10% discount)
  const saveOrderToFirestore = async () => {
    if (items.length === 0) return null;

    try {
      const orderData = {
        customerName: name.trim(),
        customerEmail: email.trim().toLowerCase(),
        customerCPF: cpf,
        customerPhone: phone,
        shippingAddress: {
          cep,
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim(),
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          variant: item.variant || '',
        })),
        totalAmount: finalTotal, // Value with 10% discount applied!
        paymentMethod: 'pix',
        status: 'pagamento_pendente',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      return docRef.id;
    } catch (err) {
      console.error('Erro ao criar pedido no Firestore:', err);
      alert('Erro de conexão ao processar seu pedido. Por favor, tente novamente.');
      throw err;
    }
  };

  // Submit PIX order
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      alert('Por favor, insira um CPF válido com 11 dígitos.');
      return;
    }

    if (cep.replace(/\D/g, '').length !== 8) {
      alert('Por favor, insira um CEP válido de 8 dígitos.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      alert('Por favor, insira um telefone completo com DDD.');
      return;
    }

    setOrderStatus('processing');
    setLoadingMessage('Gerando QR Code Pix com desconto de 5% aplicado...');

    try {
      const orderId = await saveOrderToFirestore();
      if (orderId) {
        setCreatedOrderId(orderId);
        setTimeout(() => {
          setOrderStatus('pix-pending');
        }, 1500);
      }
    } catch (err) {
      setOrderStatus('typing');
    }
  };

  // Simulated live check for Pix
  const handleVerifyPix = () => {
    setOrderStatus('verifying-pix');
    setLoadingMessage('Buscando recebimento na rede Pix do Banco Central...');

    setTimeout(() => {
      setLoadingMessage('Validando autenticidade da transação interbancária...');
    }, 1500);

    setTimeout(() => {
      setLoadingMessage('Confirmando liquidação de fundos...');
    }, 3000);

    setTimeout(() => {
      setOrderStatus('success');
      clearCart();
    }, 4500);
  };

  return (
    <div className="checkout-layout">
      {/* Checkout Header */}
      <header className="checkout-header">
        <Link to="/" className="logo checkout-logo">
          <Compass size={28} className="logo-icon" />
          Bússola <span className="logo-highlight">Kids</span>
        </Link>
        <div className="secure-checkout-badge">
          <Lock size={16} />
          <span>Checkout Ultra-Rápido 1-Step</span>
        </div>
      </header>

      {/* Lead Autofill Notification */}
      {hasAutofilled && orderStatus === 'typing' && (
        <div className="autofill-notification-banner">
          <Sparkles size={16} className="sparkles-icon" />
          <span>⚡ <strong>Compra Expressa:</strong> Seus dados foram preenchidos automaticamente para economizar seu tempo!</span>
        </div>
      )}

      <div className="checkout-container">
        <div className="checkout-grid">

          {/* ── Form Section (1-Step) ── */}
          <div className="checkout-form-section">
            <h2 className="checkout-title">Finalizar Compra</h2>
            <p className="checkout-subtitle">Preencha seus dados reais para faturamento do pedido e envio da transportadora.</p>

            <form onSubmit={handleCheckoutSubmit} className="checkout-form">

              {/* 1. Dados Pessoais */}
              <div className="form-section">
                <h3>1. Dados Pessoais</h3>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="input-row">
                  <input
                    type="email"
                    placeholder="E-mail para receber rastreio"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    required
                    className="input-half"
                  />
                  <input
                    type="text"
                    placeholder="CPF (obrigatório para nota fiscal)"
                    value={cpf}
                    onChange={(e) => handleFieldChange('cpf', e.target.value)}
                    required
                    className="input-half"
                  />
                </div>
                <div className="input-group">
                  <input
                    type="tel"
                    placeholder="Telefone / WhatsApp"
                    value={phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 2. Endereço */}
              <div className="form-section">
                <h3>2. Endereço de Entrega</h3>
                <div className="input-row">
                  <input
                    type="text"
                    placeholder="CEP"
                    value={cep}
                    onChange={(e) => handleFieldChange('cep', e.target.value)}
                    required
                    className="input-third"
                  />
                  <input
                    type="text"
                    placeholder="Rua / Avenida"
                    value={street}
                    onChange={(e) => handleFieldChange('street', e.target.value)}
                    required
                    className="input-two-thirds"
                  />
                </div>
                <div className="input-row">
                  <input
                    id="checkout-number"
                    type="text"
                    placeholder="Número"
                    value={number}
                    onChange={(e) => handleFieldChange('number', e.target.value)}
                    required
                    className="input-third"
                  />
                  <input
                    type="text"
                    placeholder="Complemento (Apto, bloco, etc.)"
                    value={complement}
                    onChange={(e) => handleFieldChange('complement', e.target.value)}
                    className="input-two-thirds"
                  />
                </div>
              </div>

              {/* 3. Pagamento Único Exclusivo */}
              <div className="form-section">
                <h3>3. Forma de Pagamento Única</h3>
                
                <div className="payment-methods-single-pix">
                  <div className="pix-single-option-card">
                    <div className="pix-single-header">
                      <QrCode size={28} className="payment-icon" />
                      <div className="pix-single-title">
                        <span>PIX Express</span>
                        <span className="badge-promo-discount">5% DE DESCONTO APLICADO</span>
                      </div>
                    </div>
                    <p className="pix-single-description">
                      Aprovação instantânea de segurança na rede do Banco Central. O pedido é liberado para empacotamento em menos de 2 minutos.
                    </p>
                  </div>
                </div>
              </div>

              <button type="submit" className="finish-buy-btn">
                Finalizar Compra e Gerar Pix
              </button>
            </form>
          </div>

          {/* ── Order Summary ── */}
          <div className="checkout-summary-section">
            <div className="summary-card">
              <h3>Resumo do Pedido</h3>

              <div className="summary-items">
                {items.length === 0 ? (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Seu carrinho está vazio.</p>
                ) : (
                  items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="summary-item">
                      <img src={item.image} alt={item.name} className="summary-item-image" />
                      <div className="summary-item-details">
                        <span className="summary-item-name">{item.name}</span>
                        {item.variant && <span className="summary-item-variant" style={{ fontSize: '0.8rem', color: 'var(--cta-orange)', fontWeight: 500 }}>{item.variant}</span>}
                        <span className="summary-item-qty">Qtd: {item.quantity}</span>
                      </div>
                      <span className="summary-item-price">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
                <div className="summary-row highlight-discount-row" style={{ color: '#059669', fontWeight: 600 }}>
                  <span>Desconto Pix Exclusivo (5%)</span>
                  <span>-{fmt(pixDiscount)}</span>
                </div>
                <div className="summary-row highlight">
                  <span>Frete</span>
                  <span>Grátis</span>
                </div>
                <div className="summary-row total">
                  <span>Total no Pix</span>
                  <span>{fmt(finalTotal)}</span>
                </div>
              </div>

              <div className="trust-footer">
                <ShieldCheck size={20} className="trust-icon" />
                <p>Ambiente seguro criptografado ponta a ponta. Seus dados estão 100% protegidos e em total conformidade com a LGPD.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals & Loaders ── */}

      {/* 1. Processing Loader Modal */}
      {orderStatus === 'processing' && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal" style={{ padding: '40px 32px' }}>
            <Loader2 className="animate-spin text-primary" size={50} style={{ color: 'var(--cta-orange)', marginBottom: 24 }} />
            <h2 style={{ fontSize: '1.35rem', marginBottom: 12 }}>Processando Pedido Seguro</h2>
            <p style={{ color: 'var(--text-dark)', fontWeight: 500, minHeight: '44px' }}>
              {loadingMessage}
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 12 }} className="flex-center gap-2">
              <Lock size={12} />
              <span>Conexão criptografada de 256 bits</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PIX Details Modal */}
      {orderStatus === 'pix-pending' && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal" style={{ maxWidth: '520px' }}>
            <h2>Pagamento via PIX</h2>
            <p style={{ marginBottom: 16 }}>Escaneie o QR Code ou copie o código Pix abaixo para pagar de forma segura.</p>

            <div style={{
              width: '100%',
              backgroundColor: '#ecfdf5',
              border: '2px dashed #059669',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: 20
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                ⚠️ VALOR EXATO A SER PAGO
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>
                  {fmt(finalTotal)}
                </span>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#047857',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(finalTotal.toFixed(2));
                    alert('Valor de R$ ' + finalTotal.toFixed(2) + ' copiado com sucesso! Insira exatamente este valor no seu aplicativo bancário.');
                  }}
                >
                  Copiar Valor
                </button>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#065f46', display: 'block', marginTop: '8px', lineHeight: 1.4 }}>
                Insira <strong>exatamente</strong> este valor no seu aplicativo bancário. Transferir outro valor causará atrasos ou recusa automática no processamento.
              </span>
            </div>

            <div className="qr-code-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', marginBottom: '20px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCode)}`}
                alt="QR Code PIX"
                style={{ width: '180px', height: '180px' }}
              />
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '8px' }}>
                Abra o app do seu banco e aponte a câmera para o QR Code
              </span>
            </div>

            <div className="pix-copy-container">
              <p>Copie o código PIX Copia e Cola:</p>
              <div className="pix-copy-box">
                <input type="text" readOnly value={pixCode} />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode);
                    alert('Código PIX Copia e Cola copiado com sucesso!');
                  }}
                >
                  Copiar
                </button>
              </div>
            </div>

            <div style={{
              width: '100%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'left',
              marginBottom: 20,
              fontSize: '0.82rem',
              color: '#475569',
              lineHeight: 1.4
            }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--cta-orange)', fontWeight: 600, marginBottom: '6px' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>Instrução Antigolpe:</span>
              </div>
              Após a transferência, clique em <strong>"Já fiz o pagamento"</strong>. O sistema processará sua transação e registrará o pedido na fila de expedição.
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                type="button"
                className="finish-buy-btn"
                onClick={handleVerifyPix}
                style={{ marginTop: 0, flex: 1 }}
              >
                Já fiz o pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Simulated Pix Verification Spinner */}
      {orderStatus === 'verifying-pix' && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal" style={{ padding: '40px 32px' }}>
            <Loader2 className="animate-spin text-primary" size={50} style={{ color: 'var(--cta-green)', marginBottom: 24 }} />
            <h2 style={{ fontSize: '1.35rem', marginBottom: 12 }}>Validando Transação Pix</h2>
            <p style={{ color: 'var(--text-dark)', fontWeight: 500, minHeight: '44px' }}>
              {loadingMessage}
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 12 }}>
              Aguardando confirmação bancária centralizada...
            </div>
          </div>
        </div>
      )}

      {/* 4. Order Confirmation Success Modal */}
      {orderStatus === 'success' && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal" style={{ padding: '40px 32px' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--cta-green)', marginBottom: 20 }} />
            <h2>🎉 Pedido Enviado para Conferência!</h2>
            <p style={{ margin: '16px 0', color: 'var(--text-dark)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Seu pedido <strong>#{createdOrderId ? createdOrderId.slice(0, 8).toUpperCase() : 'BÚSSOLA'}</strong> foi registrado com sucesso em nosso sistema de logística!
              <br /><br />
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                🔒 <strong>Verificação de Segurança:</strong> Nosso departamento financeiro está validando o crédito da transferência. Assim que constar no extrato bancário, o status do envio será atualizado e você receberá as informações de rastreio por e-mail!
              </span>
            </p>
            <Link to="/" className="finish-buy-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}>
              Voltar para a Loja
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

