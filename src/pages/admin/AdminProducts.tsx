import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { mockProducts } from '../../data/mockProducts'; // For seeding
import { Plus, Edit, Trash2, Upload, X, HelpCircle, Tag } from 'lucide-react';
import './AdminProducts.css';

type FAQItem = { question: string; answer: string };

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [originalPrice, setOriginalPrice] = useState('');
  const [category] = useState('geral');
  const [tags, setTags] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Promo Badge (effeito02)
  const [promoBadgeEnabled, setPromoBadgeEnabled] = useState(false);
  const [promoBadgeText, setPromoBadgeText] = useState('');

  // Gift Badge (effeito-ok / Brinde)
  const [giftBadgeEnabled, setGiftBadgeEnabled] = useState(false);

  // FAQ Accordion (effeito01)
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    { question: 'Este produto é seguro para bebês e crianças pequenas?', answer: 'Sim! Todos os nossos produtos possuem certificação do Inmetro e são fabricados com materiais atóxicos e livres de BPA.' },
    { question: 'Qual é o prazo de entrega?', answer: 'Em capitais: 3 a 5 dias úteis. Demais localidades: 5 a 10 dias úteis após confirmação do pagamento.' },
    { question: 'Posso trocar ou devolver o produto?', answer: 'Sim! Você tem 7 dias corridos após o recebimento para solicitar troca ou devolução, sem custo adicional.' },
    { question: 'O produto é fiel às fotos?', answer: 'Sim! Todas as fotos são do produto real, sem filtros. Você receberá exatamente o que está vendo.' },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const prods: any[] = [];
      querySnapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prods);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    if (confirm("Deseja adicionar os produtos de teste ao Firebase?")) {
      for (const prod of mockProducts) {
        await addDoc(collection(db, 'products'), {
          name: prod.name,
          slug: prod.name.toLowerCase().replace(/ /g, '-'),
          description: "Descrição de teste para " + prod.name,
          price: prod.price,
          stock: 10,
          category: 'geral',
          images: prod.images,
          isActive: true,
          tags: prod.tags
        });
      }
      fetchProducts();
      alert("Produtos de teste adicionados!");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const newImages = [...images];
    
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
      try {
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        newImages.push(url);
      } catch (error) {
        console.error("Erro no upload da imagem:", error);
        alert("Falha ao subir a imagem " + file.name);
      }
    }
    
    setImages(newImages);
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert("Adicione pelo menos uma imagem ao produto.");
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name,
        slug: name.toLowerCase().replace(/ /g, '-'),
        description,
        price: parseFloat(price.toString()),
        originalPrice: originalPrice ? parseFloat(originalPrice.toString()) : null,
        stock: parseInt(stock.toString()),
        category,
        images: images,
        isActive: true,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        promoBadge: { enabled: promoBadgeEnabled, text: promoBadgeText.trim() },
        giftBadge: { enabled: giftBadgeEnabled },
        faqItems: faqItems.filter(f => f.question.trim() && f.answer.trim()),
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        alert("Produto atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'products'), productData);
        alert("Produto cadastrado com sucesso!");
      }
      
      setShowModal(false);
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  };

  // ── FAQ helpers ──
  const addFAQItem = () =>
    setFaqItems(prev => [...prev, { question: '', answer: '' }]);

  const removeFAQItem = (idx: number) =>
    setFaqItems(prev => prev.filter((_, i) => i !== idx));

  const updateFAQItem = (idx: number, field: 'question' | 'answer', value: string) =>
    setFaqItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const resetForm = () => {
    setEditingId(null);
    setName(''); setPrice(''); setOriginalPrice(''); setStock(''); setDescription(''); setImages([]); setTags('');
    setPromoBadgeEnabled(false); setPromoBadgeText('');
    setGiftBadgeEnabled(false);
    setFaqItems([
      { question: 'Este produto é seguro para bebês e crianças pequenas?', answer: 'Sim! Todos os nossos produtos possuem certificação do Inmetro e são fabricados com materiais atóxicos e livres de BPA.' },
      { question: 'Qual é o prazo de entrega?', answer: 'Em capitais: 3 a 5 dias úteis. Demais localidades: 5 a 10 dias úteis após confirmação do pagamento.' },
      { question: 'Posso trocar ou devolver o produto?', answer: 'Sim! Você tem 7 dias corridos após o recebimento para solicitar troca ou devolução, sem custo adicional.' },
      { question: 'O produto é fiel às fotos?', answer: 'Sim! Todas as fotos são do produto real, sem filtros. Você receberá exatamente o que está vendo.' },
    ]);
  };

  const handleNewClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setOriginalPrice(product.originalPrice || '');
    setStock(product.stock);
    setDescription(product.description || '');
    setImages(product.images || []);
    setTags(product.tags ? product.tags.join(', ') : '');
    setPromoBadgeEnabled(product.promoBadge?.enabled || false);
    setPromoBadgeText(product.promoBadge?.text || '');
    setGiftBadgeEnabled(product.giftBadge?.enabled || false);
    setFaqItems(product.faqItems && product.faqItems.length > 0 ? product.faqItems : [
      { question: 'Este produto é seguro para bebês e crianças pequenas?', answer: 'Sim! Todos os nossos produtos possuem certificação do Inmetro e são fabricados com materiais atóxicos e livres de BPA.' },
      { question: 'Qual é o prazo de entrega?', answer: 'Em capitais: 3 a 5 dias úteis. Demais localidades: 5 a 10 dias úteis após confirmação do pagamento.' },
      { question: 'Posso trocar ou devolver o produto?', answer: 'Sim! Você tem 7 dias corridos após o recebimento para solicitar troca ou devolução, sem custo adicional.' },
      { question: 'O produto é fiel às fotos?', answer: 'Sim! Todas as fotos são do produto real, sem filtros. Você receberá exatamente o que está vendo.' },
    ]);
    setShowModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este produto permanentemente? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'products', id));
        alert("Produto excluído com sucesso.");
        fetchProducts();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        alert("Erro ao excluir produto.");
      }
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-title">Gerenciar Produtos</h1>
        <div className="header-actions">
          <button className="admin-btn secondary" onClick={seedDatabase}>
            Adicionar Dados de Teste
          </button>
          <button className="admin-btn primary" onClick={handleNewClick}>
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <p>Carregando produtos do Firebase...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Nenhum produto cadastrado no banco de dados. 
                    Clique em "Adicionar Dados de Teste" para popular.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt={p.name} className="product-thumb" />
                    </td>
                    <td>{p.name}</td>
                    <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</td>
                    <td>{p.stock} un.</td>
                    <td>
                      <span className={`status-badge ${p.isActive ? 'shipped' : 'pending'}`}>
                        {p.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-icon edit" onClick={() => handleEditClick(p)} title="Editar">
                          <Edit size={18} />
                        </button>
                        <button className="action-icon delete" onClick={() => handleDeleteProduct(p.id)} title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content admin-card">
            <h2>{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleSaveProduct} className="admin-form">
              <div className="form-group">
                <label>Nome do Produto</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preço Atual (R$) <span className="required">*</span></label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Preço "De:" (riscado) <span className="optional-tag">opcional</span></label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 199,90"
                    value={originalPrice} 
                    onChange={(e) => setOriginalPrice(e.target.value)} 
                  />
                  <span className="input-hint">Deixe em branco se não houver promoção ativa.</span>
                </div>
                <div className="form-group">
                  <label>Estoque</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Imagens do Produto</label>
                
                <div className="images-preview-container">
                  {images.map((img, idx) => (
                    <div key={idx} className="image-preview">
                      <img src={img} alt={`Preview ${idx}`} />
                      <button type="button" className="remove-img-btn" onClick={() => removeImage(idx)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <div className="upload-btn-wrapper">
                    <button type="button" className="admin-btn upload-trigger" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                      {uploading ? 'Enviando...' : <><Upload size={20} /> Adicionar Foto</>}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      multiple 
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Tags (separadas por vírgula)</label>
                <input type="text" placeholder="ex: lancamento, promocao, educativo" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              {/* ── PROMO BADGE (effeito02) ── */}
              <div className="admin-feature-section">
                <div className="admin-feature-header">
                  <Tag size={18} />
                  <h4>Badge de Promoção</h4>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={promoBadgeEnabled}
                      onChange={(e) => setPromoBadgeEnabled(e.target.checked)}
                    />
                    <span className="admin-toggle__slider" />
                    <span>{promoBadgeEnabled ? 'Ativado' : 'Desativado'}</span>
                  </label>
                </div>
                <p className="admin-feature-desc">
                  Exibe um badge animado de destaque próximo ao preço. Ótimo para promoções por tempo limitado.
                </p>
                {promoBadgeEnabled && (
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Texto do Badge</label>
                    <input
                      type="text"
                      placeholder="Ex: 🔥 Promoção especial – 47% OFF! Aproveite enquanto durar."
                      value={promoBadgeText}
                      onChange={(e) => setPromoBadgeText(e.target.value)}
                    />
                    <span className="input-hint">Deixe em branco para gerar automaticamente com base no desconto.</span>
                  </div>
                )}
              </div>

              {/* ── GIFT BADGE (effeito-ok / Brinde) ── */}
              <div className="admin-feature-section">
                <div className="admin-feature-header">
                  <span style={{fontSize: 18}}>🎁</span>
                  <h4>Brinde Incluso</h4>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={giftBadgeEnabled}
                      onChange={(e) => setGiftBadgeEnabled(e.target.checked)}
                    />
                    <span className="admin-toggle__slider" />
                    <span>{giftBadgeEnabled ? 'Ativado' : 'Desativado'}</span>
                  </label>
                </div>
                <p className="admin-feature-desc">
                  Exibe um selo interativo e animado indicando que o cliente receberá um brinde exclusivo na compra deste produto.
                </p>
              </div>

              {/* ── FAQ ACCORDION (effeito01) ── */}
              <div className="admin-feature-section">
                <div className="admin-feature-header">
                  <HelpCircle size={18} />
                  <h4>Perguntas Frequentes (FAQ)</h4>
                </div>
                <p className="admin-feature-desc">
                  Aparece na página do produto para quebrar objeções do cliente. Pré-preenchido com respostas padrão que você pode editar.
                </p>
                <div className="faq-editor">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="faq-editor__item">
                      <div className="faq-editor__num">{idx + 1}</div>
                      <div className="faq-editor__fields">
                        <input
                          type="text"
                          placeholder="Pergunta"
                          value={item.question}
                          onChange={(e) => updateFAQItem(idx, 'question', e.target.value)}
                        />
                        <textarea
                          rows={2}
                          placeholder="Resposta"
                          value={item.answer}
                          onChange={(e) => updateFAQItem(idx, 'answer', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="action-icon delete"
                        onClick={() => removeFAQItem(idx)}
                        title="Remover pergunta"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn secondary faq-add-btn" onClick={addFAQItem}>
                    <Plus size={16} /> Adicionar Pergunta
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="admin-btn secondary" onClick={() => {setShowModal(false); resetForm();}} disabled={saving}>Cancelar</button>
                <button type="submit" className="admin-btn primary" disabled={saving || uploading}>
                  {saving ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
