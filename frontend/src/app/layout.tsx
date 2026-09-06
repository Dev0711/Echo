import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Echo — Write Once, Publish Everywhere',
  description: 'The premium workspace for content creators. Publish to X, LinkedIn, Dev.to, and Hashnode simultaneously.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}