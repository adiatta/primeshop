import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrimeShop – Tech Premium',
  description: 'La caméra de poche qui redéfinit la perfection. Livraison express, paiement sécurisé.',
  keywords: ['camera', 'tech', 'gadget', 'premium', 'dropshipping'],
  openGraph: {
    title: 'PrimeShop – Tech Premium',
    description: 'PrimeLens Pro X1 – La révolution dans votre poche',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body>
        <Providers>   {/* ← enveloppe bien children ? */}
          {children}
        </Providers>
      </body>
    </html>
  );
}