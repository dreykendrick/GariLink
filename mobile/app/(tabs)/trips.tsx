import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme/tokens';
import { useMyTrips } from '../../src/api/hooks/useRentals';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../../src/components/ui/StatusBadge';

export default function TripsScreen() {
  const router = useRouter();
  
  const { 
    data: requests, 
    isLoading, 
    refetch,
    isRefetching
  } = useMyTrips();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing['3xl'] }} />
        ) : requests && requests.length > 0 ? (
          <View style={styles.feedContainer}>
            {requests.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/rental/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.listingTitle}>{item.listing?.title || 'Unknown Vehicle'}</Text>
                  <StatusBadge status={item.status} customColor={getStatusColor(item.status)} />
                </View>
                
                <View style={styles.datesContainer}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>{new Date(item.startDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>{new Date(item.endDate).toLocaleDateString()}</Text>
                  </View>
                </View>

                {item.pickupNotes && (
                  <Text style={styles.notesText} numberOfLines={2}>
                    Notes: {item.pickupNotes}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={48} color={Colors.neutral[400]} />
            </View>
            <Text style={styles.emptyTitle}>No trips booked yet</Text>
            <Text style={styles.emptyText}>
              Find a vehicle to rent and start your journey.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.md,
    backgroundColor: Colors.dark.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.neutral[0],
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  feedContainer: {
    padding: Layout.screenPadding,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  listingTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    flex: 1,
    marginRight: Spacing.sm,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.bg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.dark.textMuted,
    marginBottom: Spacing.xs,
  },
  dateValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[0],
  },
  notesText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark.textMuted,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing['5xl'],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xl,
    color: Colors.neutral[0],
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal,
  },
});
