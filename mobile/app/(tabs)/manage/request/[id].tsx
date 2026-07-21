import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../../../src/theme/tokens';
import { 
  useOwnerRequests, 
  useApproveRequest, 
  useRejectRequest, 
  useMarkReadyForPickup, 
  useStartRental, 
  useCompleteRental 
} from '../../../../src/api/hooks/useRentals';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../../../../src/components/ui/StatusBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OwnerRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: requests, isLoading } = useOwnerRequests();
  const { mutate: approveRequest, isPending: isApproving } = useApproveRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectRequest();
  const { mutate: markReady, isPending: isMarkingReady } = useMarkReadyForPickup();
  const { mutate: startRental, isPending: isStarting } = useStartRental();
  const { mutate: completeRental, isPending: isCompleting } = useCompleteRental();

  const request = requests?.find(r => r.id === id);

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

  const handleAction = (actionName: string, actionFn: (id: string, opts?: any) => void) => {
    Alert.alert(
      `${actionName} Request`,
      `Are you sure you want to ${actionName.toLowerCase()} this request?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: `Yes, ${actionName}`, 
          onPress: () => {
            actionFn(id as string, {
              onSuccess: () => {
                // optional: show toast
              }
            });
          }
        }
      ]
    );
  };

  const isPendingGlobal = isApproving || isRejecting || isMarkingReady || isStarting || isCompleting;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.neutral[0]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <StatusBadge status={request.status} />
          <Text style={styles.statusDescription}>
            Current Status: {request.status}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={styles.detailText}>Customer ID: {request.customerId}</Text>
          {/* Mock customer info */}
          <Text style={styles.detailText}>Name: {request.customer?.displayName || 'Unknown'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <Text style={styles.vehicleTitle}>{request.listing?.title || 'Unknown Vehicle'}</Text>
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
            <Text style={styles.sectionTitle}>Customer Notes</Text>
            <Text style={styles.detailText}>{request.pickupNotes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions based on status */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        {request.status === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton, isPendingGlobal && { opacity: 0.5 }]}
              onPress={() => handleAction('Reject', rejectRequest)}
              disabled={isPendingGlobal}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton, isPendingGlobal && { opacity: 0.5 }]}
              onPress={() => handleAction('Approve', approveRequest)}
              disabled={isPendingGlobal}
            >
              <Text style={styles.primaryButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'APPROVED' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton, isPendingGlobal && { opacity: 0.5 }]}
            onPress={() => handleAction('Mark Ready', markReady)}
            disabled={isPendingGlobal}
          >
            <Text style={styles.primaryButtonText}>Mark Ready for Pickup</Text>
          </TouchableOpacity>
        )}

        {request.status === 'READY_FOR_PICKUP' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton, isPendingGlobal && { opacity: 0.5 }]}
            onPress={() => handleAction('Start', startRental)}
            disabled={isPendingGlobal}
          >
            <Text style={styles.primaryButtonText}>Start Rental</Text>
          </TouchableOpacity>
        )}

        {request.status === 'IN_PROGRESS' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton, isPendingGlobal && { opacity: 0.5 }]}
            onPress={() => handleAction('Complete', completeRental)}
            disabled={isPendingGlobal}
          >
            <Text style={styles.primaryButtonText}>Complete Rental</Text>
          </TouchableOpacity>
        )}

        {['COMPLETED', 'REJECTED', 'CANCELLED'].includes(request.status) && (
          <View style={styles.completedState}>
            <Text style={styles.completedText}>No further actions available.</Text>
          </View>
        )}
      </View>
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
    paddingBottom: 120,
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
    marginBottom: Spacing.xs,
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: Colors.error[500],
    backgroundColor: 'transparent',
  },
  rejectButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.error[500],
    fontSize: Typography.fontSize.md,
  },
  primaryButton: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[500],
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
    fontSize: Typography.fontSize.md,
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
  },
  completedState: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  completedText: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.dark.textMuted,
  }
});
