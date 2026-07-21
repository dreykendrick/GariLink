import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentalsApi } from '../modules/rentals.api';
import type { CreateRentalRequestInput } from '../../types/api.types';

export const useMyTrips = () => {
  return useQuery({
    queryKey: ['myTrips'],
    queryFn: async () => {
      const response = await rentalsApi.getMyRequests();
      return response.data;
    },
  });
};

export const useOwnerRequests = () => {
  return useQuery({
    queryKey: ['ownerRequests'],
    queryFn: async () => {
      const response = await rentalsApi.getOwnerRequests();
      return response.data;
    },
  });
};

export const useCreateRentalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRentalRequestInput) => rentalsApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
    },
  });
};

export const useCancelRentalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalsApi.cancelRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['myTrips'] });
      queryClient.invalidateQueries({ queryKey: ['rentalRequest', id] });
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalsApi.approveRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['rentalRequest', id] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalsApi.rejectRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['rentalRequest', id] });
    },
  });
};

export const useMarkReadyForPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalsApi.markReadyForPickup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['rentalRequest', id] });
    },
  });
};

export const useStartRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalsApi.startRental(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['rentalRequest', id] });
    },
  });
};

export const useCompleteRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalsApi.completeRental(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['rentalRequest', id] });
    },
  });
};
