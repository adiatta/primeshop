'use client';
import Link from 'next/link';

const LINKS = [
  { title: 'Aide',       items: [['FAQ', '/faq'], ['Contact', '/contact'], ['Livraisons', '/shipping'], ['Retours', '/returns']] },
  { title: 'Légal',      items: [['CGV', '/cgv'], ['Confidentialité', '/privacy'], ['Cookies', '/cookies']] },
  { title: 'Suivez-nous',items: [['Instagram', '#'], ['TikTok', '#'], ['YouTube', '#']] },
];

export function Footer() {
  return (
    <footer className="bg-[#111318] border-t border-[#1e2433] pt-12 pb-8 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        <div>
          <p className="text-xl font-black bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent mb-3">
            PrimeShop
          </p>
          <p className="text-[#8b96b0] text-sm leading-relaxed">
            La tech premium, livrée chez vous. Qualité et excellence depuis 2024.
          </p>
        </div>
        {LINKS.map(section => (
          <div key={section.title}>
            <p className="text-white font-bold text-sm mb-3">{section.title}</p>
            {section.items.map(([label, href]) => (
              <Link key={label} href={href} className="block text-[#8b96b0] text-sm mb-2 hover:text-white transition">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-[#1e2433] pt-6 text-center text-[#8b96b0] text-xs">
        © {new Date().getFullYear()} PrimeShop · Tous droits réservés · Paiements sécurisés 🔒
      </div>
    </footer>
  );
}