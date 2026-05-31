import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Plus, Calendar, Edit, Trash2 } from 'lucide-react';
import './AdminBanners.css';

export function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState('hero_main');
  const [activeFrom, setActiveFrom] = useState('');
  const [activeUntil, setActiveUntil] = useState('');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'banners'));
      const bns: any[] = [];
      querySnapshot.forEach((doc) => {
        bns.push({ id: doc.id, ...doc.data() });
      });
      setBanners(bns);
    } catch (error) {
      console.error("Erro ao buscar banners:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert("Por favor, faça o upload de uma imagem.");
      return;
    }
    
    setSaving(true);
    try {
      const bannerData = {
        imageUrl,
        link,
        position,
        activeFrom: Timestamp.fromDate(new Date(activeFrom)),
        activeUntil: Timestamp.fromDate(new Date(activeUntil)),
        isActive: true
      };

      if (editingBannerId) {
        await updateDoc(doc(db, 'banners', editingBannerId), bannerData);
        alert("Banner atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'banners'), bannerData);
        alert("Banner cadastrado com sucesso!");
      }

      setShowModal(false);
      fetchBanners();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar banner:", error);
      alert("Erro ao salvar banner.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingBannerId(null);
    setImageUrl(''); setLink(''); setPosition('hero_main'); setActiveFrom(''); setActiveUntil('');
  };

  const handleNewClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (banner: any) => {
    setEditingBannerId(banner.id);
    setImageUrl(banner.imageUrl);
    setLink(banner.link);
    setPosition(banner.position);
    // Convert timestamp to YYYY-MM-DD
    const fromDate = banner.activeFrom.toDate();
    const untilDate = banner.activeUntil.toDate();
    setActiveFrom(fromDate.toISOString().split('T')[0]);
    setActiveUntil(untilDate.toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este banner permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        alert("Banner excluído com sucesso.");
        fetchBanners();
      } catch (error) {
        console.error("Erro ao excluir banner:", error);
        alert("Erro ao excluir banner.");
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', id), {
        isActive: !currentStatus
      });
      fetchBanners();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <div className="admin-banners-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Banners Sazonais</h1>
          <p className="admin-subtitle">Programe as campanhas da Vitrine (Natal, Dia das Crianças, etc).</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn primary" onClick={handleNewClick}>
            <Plus size={20} />
            Novo Banner
          </button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <p>Carregando banners...</p>
        ) : (
          <div className="banners-grid">
            {banners.length === 0 ? (
              <div className="empty-state">Nenhum banner cadastrado.</div>
            ) : (
              banners.map(banner => (
                <div key={banner.id} className="banner-card">
                  <div className="banner-img-container">
                    <img src={banner.imageUrl} alt="Banner" />
                    <span className={`position-badge ${banner.position}`}>{banner.position}</span>
                  </div>
                  <div className="banner-info">
                    <div className="banner-dates">
                      <Calendar size={16} />
                      <span>
                        {banner.activeFrom.toDate().toLocaleDateString('pt-BR')} até {banner.activeUntil.toDate().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="banner-actions">
                      <button 
                        className={`toggle-btn ${banner.isActive ? 'active' : 'inactive'}`}
                        onClick={() => toggleStatus(banner.id, banner.isActive)}
                        title={banner.isActive ? "Desativar campanha" : "Ativar campanha"}
                      >
                        {banner.isActive ? 'Ligado' : 'Desligado'}
                      </button>
                      <button className="action-icon edit" onClick={() => handleEditClick(banner)} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button className="action-icon delete" onClick={() => handleDeleteBanner(banner.id)} title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content admin-card">
            <h2>{editingBannerId ? 'Editar Banner' : 'Cadastrar Novo Banner'}</h2>
            <form onSubmit={handleSaveBanner} className="admin-form">
              <div className="form-group">
                <label>URL da Imagem do Banner</label>
                <input 
                  type="url" 
                  placeholder="https://exemplo.com/imagem.png" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  required 
                />
                
                {imageUrl && (
                  <div className="banner-preview-box mt-3">
                    <img src={imageUrl} alt="Preview" />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Posição na Vitrine</label>
                <select value={position} onChange={(e) => setPosition(e.target.value)}>
                  <option value="hero_main">Principal (Grande)</option>
                  <option value="hero_side_top">Lateral Superior</option>
                  <option value="hero_side_bottom">Lateral Inferior</option>
                </select>
              </div>

              <div className="form-group">
                <label>Link de Destino</label>
                <input 
                  type="text" 
                  placeholder="/categoria/brinquedos" 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Início</label>
                  <input 
                    type="date" 
                    value={activeFrom} 
                    onChange={(e) => setActiveFrom(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Data de Encerramento</label>
                  <input 
                    type="date" 
                    value={activeUntil} 
                    onChange={(e) => setActiveUntil(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="admin-btn secondary" onClick={() => {setShowModal(false); resetForm();}} disabled={saving}>Cancelar</button>
                <button type="submit" className="admin-btn primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
