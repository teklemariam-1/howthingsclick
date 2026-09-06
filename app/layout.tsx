import type { Metadata } from 'next';
import './globals.css';
import './engine.css';

export const metadata: Metadata = {
  title: 'Inside the engine — How Things Click',
  description:
    'Explore a working four-cylinder engine in 3D. Inspect the mechanisms, take the assemblies apart, and follow the oil and cooling circuits.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
