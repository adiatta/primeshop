'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Props { images: string[]; name: string; }

export function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#161a22] mb-3 border border-[#1e2433]">
        {!loaded[active] && (
          <div className="absolute inset-0 skeleton" />
        )}
        {images[active] ? (
          <Image
            src={images[active]} alt={name} fill
            className="object-cover transition-all duration-300"
            onLoad={() => setLoaded(l => ({ ...l, [active]: true }))}
            priority={active === 0}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">📷</div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="flex-1 aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer p-0"
              style={{ borderColor: active === i ? '#2563eb' : 'transparent' }}>
              <Image src={img} alt={`${name} ${i + 1}`} width={80} height={80} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}