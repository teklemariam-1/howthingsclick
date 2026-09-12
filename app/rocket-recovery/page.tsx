import type { Metadata } from 'next';
import RecoveryLab from '@/components/rocket-recovery/lab';
export const metadata: Metadata = {
  title: 'How SpaceX Lands and Catches Rockets — Interactive 3D Lab',
  description:
    'Land a Falcon 9 booster or catch Super Heavy. Explore grid fins, gimballed engines, landing legs and tower arms, then try the landing challenge.',
  alternates: { canonical: 'https://www.howthingsclick.com/rocket-recovery' },
  openGraph: {
    title: 'How do you catch a falling rocket?',
    description: 'Explore the engineering. Then try the landing yourself.',
    url: 'https://www.howthingsclick.com/rocket-recovery',
    images: [
      {
        url: '/images/rocket-recovery-preview.png',
        width: 1600,
        height: 900,
        alt: 'Super Heavy booster approaching a detailed catch tower above the coast.',
      },
    ],
  },
};
export default function RocketRecoveryPage() {
  return <RecoveryLab />;
}
