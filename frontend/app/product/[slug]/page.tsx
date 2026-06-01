import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Récupère le produit depuis l'API (SSR pour le SEO)
async function getProduct(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`,
      { next: { revalidate: 3600 } } // Cache 1h
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Métadonnées dynamiques pour le SEO
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Produit introuvable' };
  return {
    title:       `${product.name} – PrimeShop`,
    description: product.description,
    openGraph: {
      title:       product.name,
      description: product.description,
      images:      [product.images?.[0]],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  // On réutilise la HomePage en passant le produit
  // Pour un vrai multi-produit, construisez un composant dédié
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-3xl font-black mb-4">{product.name}</h1>
        <p className="text-[#8b96b0] mb-6">{product.description}</p>
        <p className="text-4xl font-black text-blue-400 mb-8">{product.price}€</p>
        <a href="/" className="px-8 py-4 bg-blue-600 rounded-xl font-bold text-white">
          Voir le store →
        </a>
      </div>
    </div>
  );
}