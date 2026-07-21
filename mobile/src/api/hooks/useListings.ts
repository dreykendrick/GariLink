import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi, CreateListingInput } from '../modules/listings.api';

export const useMyListings = () => {
  return useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const response = await listingsApi.getMine();
      return response.data;
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateListingInput> }) =>
      listingsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', variables.id] });
    },
  });
};

export const usePublishListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};

export const usePauseListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsApi.pause(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};

export const useArchiveListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsApi.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};

export const useRestoreListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsApi.restore(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};
