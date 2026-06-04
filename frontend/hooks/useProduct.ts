import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product } from '@/types';

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn:  () => api.get(`/products/${slug}`).then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useProducts(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn:  () => api.get('/products', { params }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn:  () => api.get(`/reviews/${productId}`).then(r => r.data),
  });
}