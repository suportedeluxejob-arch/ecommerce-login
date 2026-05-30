import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Hero.css';

export function Hero() {
  const [banners, setBanners] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchActiveBanners() {
      try {
        const now = Timestamp.now();
        const q = query(
          collection(db, 'banners'),
          where('isActive', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const activeBanners: Record<string, any> = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Check if current date is within the activeFrom and activeUntil range
          if (data.activeFrom.seconds <= now.seconds && data.activeUntil.seconds >= now.seconds) {
            activeBanners[data.position] = data;
          }
        });
        
        setBanners(activeBanners);
      } catch (error) {
        console.error("Erro ao buscar banners ativos:", error);
      }
    }
    fetchActiveBanners();
  }, []);

  const mainBanner = banners['hero_main'] || {
    imageUrl: '/hero-main.png',
    link: '/promocoes',
    fallback: true
  };

  const sideTopBanner = banners['hero_side_top'] || {
    imageUrl: '/hero-side-1.png',
    link: '/categoria/passeio',
    fallback: true
  };

  const sideBottomBanner = banners['hero_side_bottom'] || {
    imageUrl: '/hero-side-2.png',
    link: '/categoria/pelucias',
    fallback: true
  };

  return (
    <section className="hero-section">
      <div className="hero-grid">
        <a href={mainBanner.link} className="hero-item hero-main">
          <img src={mainBanner.imageUrl} alt="Banner Principal" className="hero-image" />
          {mainBanner.fallback && (
            <div className="hero-content">
              <span className="hero-tag">Oferta Especial</span>
              <h2 className="hero-title">Desenvolvimento<br/>com Diversão</h2>
              <p className="hero-subtitle">Brinquedos em madeira com 20% OFF</p>
              <button className="hero-btn">Comprar Agora</button>
            </div>
          )}
        </a>
        
        <a href={sideTopBanner.link} className="hero-item hero-side-top">
          <img src={sideTopBanner.imageUrl} alt="Banner Lateral Superior" className="hero-image" />
          {sideTopBanner.fallback && (
            <div className="hero-content hero-content-small">
              <h3 className="hero-title-small">Passeio Seguro</h3>
              <span className="hero-link">Ver modelos &rarr;</span>
            </div>
          )}
        </a>
        
        <a href={sideBottomBanner.link} className="hero-item hero-side-bottom">
          <img src={sideBottomBanner.imageUrl} alt="Banner Lateral Inferior" className="hero-image" />
          {sideBottomBanner.fallback && (
            <div className="hero-content hero-content-small">
              <span className="hero-tag-small">Novidade</span>
              <h3 className="hero-title-small">Abraço Quentinho</h3>
              <span className="hero-link">Descubra &rarr;</span>
            </div>
          )}
        </a>
      </div>
    </section>
  );
}
