'use client';
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export function Skeleton({ className = '', width, height, rounded = 'rounded-lg' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
      <Skeleton height={240} rounded="rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width="80%" />
        <Skeleton height={20} width="40%" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-[#1e2433] items-center">
      <Skeleton width={60}  height={60} rounded="rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="50%" />
        <Skeleton height={12} width="30%" />
      </div>
      <Skeleton width={80} height={28} rounded="rounded-full" />
    </div>
  );
}