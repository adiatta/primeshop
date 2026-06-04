import { Review } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props { review: Review; }

export function ReviewCard({ review }: Props) {
  return (
    <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
            {review.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-bold text-sm text-white">{review.user?.name ?? 'Anonyme'}</p>
            <p className="text-xs text-[#8b96b0]">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        {review.verified && (
          <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">✓ Vérifié</span>
        )}
      </div>
      <div className="flex gap-0.5 mb-2">
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: i <= review.rating ? '#fbbf24' : '#374151', fontSize: 14 }}>★</span>
        ))}
      </div>
      <p className="text-sm text-[#8b96b0] leading-relaxed">{review.comment}</p>
    </div>
  );
}