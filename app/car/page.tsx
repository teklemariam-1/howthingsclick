import type { Metadata } from 'next';
import CarExhibit from '@/components/engine/car-exhibit';
export const metadata: Metadata = {
  title: 'Inside the Corolla',
  description:
    'Explore a Corolla in 3D. Separate the body, cabin, wheels, and mechanical systems, then open the detailed engine lab.',
};
export default function CarPage() {
  return <CarExhibit />;
}
