'use client';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else      document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      {/* Panel */}
      <div
        className="relative bg-[#111318] border border-[#1e2433] rounded-2xl p-7 w-full shadow-2xl animate-slide-up"
        style={{ maxWidth }}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-[#8b96b0] hover:text-white transition">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button onClick={onClose} className="absolute top-4 right-4 text-[#8b96b0] hover:text-white transition">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}