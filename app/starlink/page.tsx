import type { Metadata } from 'next';
import StarlinkLab from '@/components/starlink/lab';
export const metadata: Metadata = {
  title: 'How Starlink Actually Works — Interactive 3D Lab',
  description:
    'Follow a packet from a phased-array terminal through moving satellites, laser links and ground gateways. Explore a detailed original 3D reconstruction and two guided tours.',
};
export default function StarlinkPage() {
  return <StarlinkLab />;
}
