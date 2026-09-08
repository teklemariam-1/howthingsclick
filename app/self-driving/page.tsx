import type { Metadata } from 'next';
import SelfDrivingLab from '@/components/self-driving/lab';
export const metadata: Metadata = {
  title: 'How Self-Driving Cars Work — Interactive 3D Lab',
  description:
    'Open a Cybercab-inspired 3D cutaway. Follow cameras, onboard computing, perception, planning and physical controls; change the scenario and inspect the feedback loop.',
};
export default function SelfDrivingPage() {
  return <SelfDrivingLab />;
}
