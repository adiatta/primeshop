'use client';
import Image from 'next/image';
import { CartItem as CartItemType } from '@/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  item:     CartItemType;
  onRemove: (id: string) => void;
  onQty:    (id: string, qty: number) => void;
}

export function CartItem({ item, onRemove, onQty }: Props) {
  return (
    <div className="flex gap-4 p-4 bg-[#161a22] border border-[#1e2433] rounded-2xl">
      <div className="relative w-18 h-18 rounded-xl overflow-hidden flex-shrink-0" style={{ width: 72, height: 72 }}>
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white truncate mb-1">{item.name}</p>
        {item.variant && <p className="text-xs text-[#8b96b0] mb-2">{item.variant}</p>}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center border border-[#1e2433] rounded-lg bg-[#0a0c10]">
            <button onClick={() => item.quantity > 1 ? onQty(item.id, item.quantity - 1) : onRemove(item.id)}
              className="px-3 py-1 text-base text-white bg-transparent border-none cursor-pointer">−</button>
            <span className="px-3 text-sm font-bold text-white">{item.quantity}</span>
            <button onClick={() => onQty(item.id, item.quantity + 1)}
              className="px-3 py-1 text-base text-white bg-transparent border-none cursor-pointer">+</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black text-blue-400">{formatPrice(item.price * item.quantity)}</span>
            <button onClick={() => onRemove(item.id)} className="text-red-400 text-base bg-transparent border-none cursor-pointer hover:text-red-300">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}