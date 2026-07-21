import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '../infrastructure/listing.service';

export const useSearchListings = (filters?: Record<string, any>) => {
  return useInfiniteQuery({
    queryKey: ['listings', filters],
    queryFn: ({ pageParam = 1 }) => listingService.searchListings({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useListing = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingService.getListing(id),
    enabled: !!id,
  });
};

export const useSavedListings = () => {
  return useQuery({
    queryKey: ['savedListings'],
    queryFn: () => listingService.getSavedListings(),
  });
};

export const useToggleFavourite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'save' | 'remove' }) => {
      if (action === 'save') {
        return listingService.saveListing(id);
      }
      return listingService.removeSavedListing(id);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};
