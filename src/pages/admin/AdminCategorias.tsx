import { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Plus, Edit, Trash2, Tag, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import './AdminCategorias.css';

// Default categories with slug mapping
const DEFAULT_CATEGORIES = [
  { slug: '0-2-anos', label: '0 a 2 anos', description: 'Bebês e primeiros passos' },
  { slug: '3-5-anos', label: '3 a 5 anos', description: 'Pré-escola e descobertas' },
  { slug: '6-8-anos', label: '6 a 8 anos', description: 'Fase escolar inicial' },
  { slug: 'educativos', label: 'Educativos', description: 'Estimulam o desenvolvimento' },
  { slug: 'ao-ar-livre', label: 'Ao Ar Livre', description: 'Brincadeiras e movimento' },
  { slug: 'roupas', label: 'Roupas', description: 'Vestuário infantil' },
];

// Seasonal event presets for quick setup
const EVENT_PRESETS = [
  { id: 'black-friday', label: 'Black Friday', defaultTag: 'black-friday', color: '#1a1a1a' },
  { id: 'natal', label: 'Natal', defaultTag: 'natal', color: '#c62828' },
  { id: 'dia-criancas', label: 'Dia das Crianças', defaultTag: 'dia-criancas', color: '#f57c00' },
  { id: 'volta-aulas', label: 'Volta às Aulas', defaultTag: 'volta-aulas', color: '#1565c0' },
  { id: 'pascoa', label: 'Páscoa', defaultTag: 'pascoa', color: '#6a1b9a' },
  { id: 'dia-maes', label: 'Dia das Mães', defaultTag: 'dia-maes', color: '#e91e63' },
  { id: 'liquidacao', label: 'Liquidação', defaultTag: 'promocao', color: '#e53e3e' },
  { id: 'custom', label: 'Evento Personalizado', defaultTag: '', color: '#2B3A67' },
];

export function AdminCategorias() {
  const [activeTab, setActiveTab] = useState<'categorias' | 'eventos'>('categorias');

  // Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catLabel, setCatLabel] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [eventLabel, setEventLabel] = useState('');
  const [eventTag, setEventTag] = useState('');
  const [eventActiveFrom, setEventActiveFrom] = useState('');
  const [eventActiveUntil, setEventActiveUntil] = useState('');
  const [eventBannerMsg, setEventBannerMsg] = useState('');
  const [eventColor, setEventColor] = useState('#2B3A67');
  const [eventSaving, setEventSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  // --- CATEGORIES ---
  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const cats: any[] = [];
      snap.forEach(d => cats.push({ id: d.id, ...d.data() }));
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setCatLoading(false);
    }
  };

  const seedDefaultCategories = async () => {
    if (!confirm('Isto irá criar as categorias padrão da loja no Firebase. Continuar?')) return;
    for (const cat of DEFAULT_CATEGORIES) {
      await addDoc(collection(db, 'categories'), { ...cat, isActive: true });
    }
    fetchCategories();
    alert('Categorias padrão criadas!');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      const data = {
        label: catLabel,
        slug: catSlug.toLowerCase().replace(/\s+/g, '-'),
        description: catDescription,
        isActive: true,
      };
      if (editingCatId) {
        await updateDoc(doc(db, 'categories', editingCatId), data);
      } else {
        await addDoc(collection(db, 'categories'), data);
      }
      setShowCatModal(false);
      resetCatForm();
      fetchCategories();
    } catch (e) {
      alert('Erro ao salvar categoria.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleToggleCategory = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'categories', id), { isActive: !current });
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria permanentemente?')) return;
    await deleteDoc(doc(db, 'categories', id));
    fetchCategories();
  };

  const handleEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setCatLabel(cat.label);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || '');
    setShowCatModal(true);
  };

  const resetCatForm = () => {
    setEditingCatId(null);
    setCatLabel(''); setCatSlug(''); setCatDescription('');
  };

  // --- EVENTS ---
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'events'));
      const evts: any[] = [];
      snap.forEach(d => evts.push({ id: d.id, ...d.data() }));
      setEvents(evts);
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = EVENT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      if (presetId !== 'custom') setEventLabel(preset.label);
      setEventTag(preset.defaultTag);
      setEventColor(preset.color);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventSaving(true);
    try {
      const data = {
        label: eventLabel,
        tag: eventTag,
        bannerMessage: eventBannerMsg,
        color: eventColor,
        activeFrom: eventActiveFrom,
        activeUntil: eventActiveUntil,
        isActive: true,
      };
      if (editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), data);
      } else {
        await addDoc(collection(db, 'events'), data);
      }
      setShowEventModal(false);
      resetEventForm();
      fetchEvents();
    } catch (e) {
      alert('Erro ao salvar evento.');
    } finally {
      setEventSaving(false);
    }
  };

  const handleToggleEvent = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'events', id), { isActive: !current });
    fetchEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Excluir este evento permanentemente?')) return;
    await deleteDoc(doc(db, 'events', id));
    fetchEvents();
  };

  const handleEditEvent = (evt: any) => {
    setEditingEventId(evt.id);
    setEventLabel(evt.label);
    setEventTag(evt.tag);
    setEventBannerMsg(evt.bannerMessage || '');
    setEventColor(evt.color || '#2B3A67');
    setEventActiveFrom(evt.activeFrom || '');
    setEventActiveUntil(evt.activeUntil || '');
    setShowEventModal(true);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventLabel(''); setEventTag(''); setEventBannerMsg('');
    setEventColor('#2B3A67'); setEventActiveFrom(''); setEventActiveUntil('');
    setSelectedPreset('custom');
  };

  const isEventActive = (evt: any) => {
    if (!evt.isActive) return false;
    const now = new Date();
    if (evt.activeFrom && new Date(evt.activeFrom) > now) return false;
    if (evt.activeUntil && new Date(evt.activeUntil) < now) return false;
    return true;
  };

  return (
    <div className="admin-categorias-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Categorias & Eventos</h1>
          <p className="admin-subtitle">Organize a vitrine e programe campanhas sazonais.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="cat-tabs">
        <button
          className={`cat-tab ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          <Tag size={16} /> Categorias
        </button>
        <button
          className={`cat-tab ${activeTab === 'eventos' ? 'active' : ''}`}
          onClick={() => setActiveTab('eventos')}
        >
          <Zap size={16} /> Eventos Sazonais
        </button>
      </div>

      {/* ===== CATEGORIAS ===== */}
      {activeTab === 'categorias' && (
        <div>
          <div className="tab-actions">
            {categories.length === 0 && (
              <button className="admin-btn secondary" onClick={seedDefaultCategories}>
                Criar Categorias Padrão
              </button>
            )}
            <button className="admin-btn primary" onClick={() => { resetCatForm(); setShowCatModal(true); }}>
              <Plus size={18} /> Nova Categoria
            </button>
          </div>

          <div className="admin-card">
            {catLoading ? (
              <p>Carregando categorias...</p>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                Nenhuma categoria cadastrada. Clique em "Criar Categorias Padrão" para começar.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Slug (URL)</th>
                    <th>Descrição</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td><strong>{cat.label}</strong></td>
                      <td><code className="slug-code">/{cat.slug}</code></td>
                      <td className="text-muted">{cat.description}</td>
                      <td>
                        <span className={`status-badge ${cat.isActive ? 'shipped' : 'pending'}`}>
                          {cat.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-icon edit"
                            title={cat.isActive ? 'Desativar' : 'Ativar'}
                            onClick={() => handleToggleCategory(cat.id, cat.isActive)}
                          >
                            {cat.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button className="action-icon edit" onClick={() => handleEditCategory(cat)} title="Editar">
                            <Edit size={18} />
                          </button>
                          <button className="action-icon delete" onClick={() => handleDeleteCategory(cat.id)} title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== EVENTOS ===== */}
      {activeTab === 'eventos' && (
        <div>
          <div className="tab-actions">
            <button className="admin-btn primary" onClick={() => { resetEventForm(); setShowEventModal(true); }}>
              <Plus size={18} /> Novo Evento
            </button>
          </div>

          <div className="events-grid">
            {eventsLoading ? (
              <p>Carregando eventos...</p>
            ) : events.length === 0 ? (
              <div className="admin-card empty-state">
                Nenhum evento cadastrado. Crie seu primeiro evento sazonal (ex: Black Friday, Natal).
              </div>
            ) : (
              events.map(evt => (
                <div key={evt.id} className={`event-card ${isEventActive(evt) ? 'event-live' : ''}`}>
                  <div className="event-color-bar" style={{ backgroundColor: evt.color }} />
                  <div className="event-card-body">
                    <div className="event-card-header">
                      <h3>{evt.label}</h3>
                      {isEventActive(evt) && <span className="live-badge">AO VIVO</span>}
                    </div>
                    <div className="event-meta">
                      <span>Tag: <code>{evt.tag}</code></span>
                      {evt.activeFrom && <span>{evt.activeFrom} → {evt.activeUntil}</span>}
                    </div>
                    {evt.bannerMessage && (
                      <p className="event-banner-preview">"{evt.bannerMessage}"</p>
                    )}
                    <div className="event-actions">
                      <button
                        className={`toggle-btn ${evt.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleEvent(evt.id, evt.isActive)}
                      >
                        {evt.isActive ? 'Ligado' : 'Desligado'}
                      </button>
                      <button className="action-icon edit" onClick={() => handleEditEvent(evt)} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button className="action-icon delete" onClick={() => handleDeleteEvent(evt.id)} title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== CATEGORY MODAL ===== */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content admin-card">
            <h2>{editingCatId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <form onSubmit={handleSaveCategory} className="admin-form">
              <div className="form-group">
                <label>Nome da Categoria</label>
                <input type="text" value={catLabel} onChange={e => { setCatLabel(e.target.value); if (!editingCatId) setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')); }} required />
              </div>
              <div className="form-group">
                <label>Slug (URL)</label>
                <input type="text" value={catSlug} onChange={e => setCatSlug(e.target.value)} required />
                <span className="input-hint">Aparece na URL: /categoria/{catSlug || 'seu-slug'}</span>
              </div>
              <div className="form-group">
                <label>Descrição curta</label>
                <input type="text" value={catDescription} onChange={e => setCatDescription(e.target.value)} placeholder="Ex: Produtos para bebês" />
              </div>
              <div className="modal-actions">
                <button type="button" className="admin-btn secondary" onClick={() => { setShowCatModal(false); resetCatForm(); }}>Cancelar</button>
                <button type="submit" className="admin-btn primary" disabled={catSaving}>
                  {catSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EVENT MODAL ===== */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content admin-card modal-large">
            <h2>{editingEventId ? 'Editar Evento' : 'Novo Evento Sazonal'}</h2>

            {!editingEventId && (
              <div className="form-group">
                <label>Tipo de Evento</label>
                <div className="preset-grid">
                  {EVENT_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`preset-btn ${selectedPreset === p.id ? 'selected' : ''}`}
                      style={{ borderColor: selectedPreset === p.id ? p.color : undefined }}
                      onClick={() => handlePresetSelect(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome do Evento</label>
                  <input type="text" value={eventLabel} onChange={e => setEventLabel(e.target.value)} placeholder="Ex: Black Friday 2025" required />
                </div>
                <div className="form-group">
                  <label>Tag dos Produtos</label>
                  <input type="text" value={eventTag} onChange={e => setEventTag(e.target.value)} placeholder="Ex: black-friday" required />
                  <span className="input-hint">Coloque esta tag nos produtos que participam do evento.</span>
                </div>
              </div>

              <div className="form-group">
                <label>Mensagem do Banner / Barra de Topo</label>
                <input type="text" value={eventBannerMsg} onChange={e => setEventBannerMsg(e.target.value)} placeholder="Ex: Black Friday! Até 50% OFF em produtos selecionados" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Início</label>
                  <input type="date" value={eventActiveFrom} onChange={e => setEventActiveFrom(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Data de Encerramento</label>
                  <input type="date" value={eventActiveUntil} onChange={e => setEventActiveUntil(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cor do Evento</label>
                  <input type="color" value={eventColor} onChange={e => setEventColor(e.target.value)} className="color-input" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="admin-btn secondary" onClick={() => { setShowEventModal(false); resetEventForm(); }}>Cancelar</button>
                <button type="submit" className="admin-btn primary" disabled={eventSaving}>
                  {eventSaving ? 'Salvando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
