import { Hero } from '../components/Hero';
import { CategoryNav } from '../components/CategoryNav';
import { ProductShowcase } from '../components/ProductShowcase';
import { SocialProof } from '../components/SocialProof';

export function HomePage() {
  return (
    <main>
      <Hero />
      <CategoryNav />
      <ProductShowcase />
      <SocialProof />
    </main>
  );
}
