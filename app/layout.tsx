import type { Metadata } from 'next';
import './globals.css';
import './engine.css';
import './brand.css';

export const metadata: Metadata = {
  title: {
    default: 'How Things Click — Interactive 3D Explainers',
    template: '%s — How Things Click',
  },
  description:
    'See what makes the world click. Explore engines, cars, and the systems inside them with hands-on 3D experiences. Rotate, take apart, and discover.',
  icons: { icon: '/favicon.svg', apple: '/brand/icon-180.png' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
