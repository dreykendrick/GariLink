import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme/tokens';
import { useMyTrips, useCancelRentalRequest } from '../../src/api/hooks/useRentals';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RentalRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: requests, isLoading } = useMyTrips();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelRentalRequest();

  const request = requests?.find(r => r.id === id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return Colors.warning[500];
      case 'APPROVED': return Colors.primary[500];
      case 'REJECTED': return Colors.error[500];
      case 'CANCELLED': return Colors.neutral[400];
      case 'READY_FOR_PICKUP': return Colors.info[500];
      case 'IN_PROGRESS': return Colors.success[500];
      case 'COMPLETED': return Colors.neutral[200];
      default: return Colors.neutral[400];
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this booking request?",
      [
        { text: "No, keep it", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: () => {
            cancelRequest(id as string, {
              onSuccess: () => {
                router.back();
              }
            });
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Request not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.neutral[0]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <StatusBadge status={request.status} customColor={getStatusColor(request.status)} />
          <Text style={styles.statusDescription}>
            {request.status === 'PENDING' && "Waiting for owner's approval."}
            {request.status === 'APPROVED' && "Owner approved! Wait for them to mark it ready."}
            {request.status === 'READY_FOR_PICKUP' && "Vehicle is ready for you to pick up."}
            {request.status === 'IN_PROGRESS' && "Enjoy your trip!"}
            {request.status === 'COMPLETED' && "Trip completed. Hope you had a great time!"}
            {request.status === 'REJECTED' && "Sorry, the owner rejected this request."}
            {request.status === 'CANCELLED' && "This request was cancelled."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <Text style={styles.vehicleTitle}>{request.listing?.title || 'Unknown Vehicle'}</Text>
          <Text style={styles.detailText}>Owner ID: {request.ownerId}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rental Dates</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{new Date(request.startDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>{new Date(request.endDate).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {request.pickupNotes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.detailText}>{request.pickupNotes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Show Cancel button if the request can be cancelled */}
      {['PENDING', 'APPROVED'].includes(request.status) && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <TouchableOpacity 
            style={[styles.cancelButton, isCancelling && { opacity: 0.5 }]}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={Colors.error[500]} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
  },
  scrollContent: {
    padding: Layout.screenPadding,
    paddingBottom: 100,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
  },
  statusDescription: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[200],
    marginTop: Spacing.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    marginBottom: Spacing.sm,
  },
  vehicleTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.primary[400],
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[300],
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark.textMuted,
    marginBottom: Spacing.xs,
  },
  dateValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[0],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.bg,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error[500],
  },
  cancelButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.error[500],
    fontSize: Typography.fontSize.lg,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error[500],
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.medium,
  }
});
