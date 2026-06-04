'use client';
export function Loader({ size = 40, text }: { size?: number; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-[#1e2433] border-t-blue-500 animate-spin"
      />
      {text && <p className="text-[#8b96b0] text-sm">{text}</p>}
    </div>
  );
}

export function FullPageLoader({ text = 'Chargement…' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-[#0a0c10] flex items-center justify-center z-50">
      <div className="text-center">
        <p className="text-2xl font-black bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent mb-6">
          PrimeShop
        </p>
        <Loader size={36} text={text} />
      </div>
    </div>
  );
}