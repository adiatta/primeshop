'use client';
import Image from 'next/image';
import Link  from 'next/link';
import { Product }   from '@/types';
import { useCart }   from '@/hooks/useCart';
import { formatPrice, discountPercent } from '@/lib/utils';

interface Props { product: Product; }

export function ProductCard({ product }: Props) {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      quantity: 1,
      image:    product.images[0] ?? '',
    });
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden hover:border-blue-600/40 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-[#1e2433] flex items-center justify-center text-4xl">📦</div>
        )}
        {product.comparePrice && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discountPercent(product.comparePrice, product.price)}%
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
            Plus que {product.stock} !
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <p className="text-xs text-blue-400 font-semibold mb-1 uppercase tracking-wider">{product.category}</p>
        <h3 className="font-bold text-white mb-3 leading-tight">{product.name}</h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-sm text-[#8b96b0] line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>
          <button onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition border-none cursor-pointer">
            + Panier
          </button>
        </div>
      </div>
    </Link>
  );
}