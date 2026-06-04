import { useCartStore } from '@/store/cartStore';
import { useUIStore }   from '@/store/uiStore';
import { CartItem }     from '@/types';
import toast from 'react-hot-toast';

export function useCart() {
  const store     = useCartStore();
  const { openCart } = useUIStore();

  const addToCart = (item: CartItem) => {
    store.addItem(item);
    toast.success(`${item.name} ajouté au panier 🛒`);
    openCart();
  };

  const removeFromCart = (id: string) => {
    store.removeItem(id);
    toast.success('Article retiré du panier');
  };

  return {
    items:          store.items,
    total:          store.total(),
    count:          store.count(),
    addToCart,
    removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart:      store.clearCart,
  };
}