import type { Metadata } from 'next';
import './globals.css';
import './engine.css';

export const metadata: Metadata = {
  title: 'Inside the Corolla — How Things Click',
  description:
    'Explore the Corolla in 3D. Separate its body, cabin, wheels and mechanical systems, then dive into the detailed four-cylinder engine lab.',
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
