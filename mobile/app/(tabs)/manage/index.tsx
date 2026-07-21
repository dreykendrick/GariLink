import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListingManagementCard } from '../../../src/components/listings/ListingManagementCard';
import { useMyListings, usePublishListing, usePauseListing, useRestoreListing } from '../../../src/api/hooks/useListings';
import { useOwnerRequests } from '../../../src/api/hooks/useRentals';
import { Colors, Typography, Spacing, BorderRadius } from '../../../src/theme/tokens';
import { Listing, RentalRequest } from '../../../src/types/api.types';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function ManageDashboard() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useMyListings();
  const publishMutation = usePublishListing();
  const pauseMutation = usePauseListing();
  const restoreMutation = useRestoreListing();

  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests, isRefetching: isRefetchingRequests } = useOwnerRequests();

  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'REQUESTS'>('LISTINGS');
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED'>('ALL');

  const listings = data?.items || [];
  
  const filteredListings = listings.filter((l: Listing) => 
    filter === 'ALL' ? true : (l.status || 'draft').toUpperCase() === filter
  );

  const requests = requestsData || [];

  const handleEdit = (id: string) => {
    router.push(`/manage/listing/${id}`);
  };

  const handleRequestClick = (id: string) => {
    router.push(`/manage/request/${id}`);
  };

  const renderFilterPill = (label: string, value: typeof filter) => (
    <Text
      style={[styles.filterPill, filter === value && styles.filterPillActive]}
      onPress={() => setFilter(value)}
    >
      {label}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Owner Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your rental listings</Text>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity 
          style={[styles.segmentButton, activeTab === 'LISTINGS' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('LISTINGS')}
        >
          <Text style={[styles.segmentText, activeTab === 'LISTINGS' && styles.segmentTextActive]}>Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentButton, activeTab === 'REQUESTS' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('REQUESTS')}
        >
          <Text style={[styles.segmentText, activeTab === 'REQUESTS' && styles.segmentTextActive]}>Requests</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'LISTINGS' ? (
        <>
          <View style={styles.filtersContainer}>
            {renderFilterPill('All', 'ALL')}
            {renderFilterPill('Published', 'PUBLISHED')}
            {renderFilterPill('Drafts', 'DRAFT')}
            {renderFilterPill('Paused', 'PAUSED')}
          </View>

          {isLoading && !isRefetching ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={filteredListings}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <ListingManagementCard
                  listing={item}
                  onPress={() => handleEdit(item.id)}
                  onPublish={() => publishMutation.mutate(item.id)}
                  onPause={() => pauseMutation.mutate(item.id)}
                  onRestore={() => restoreMutation.mutate(item.id)}
                />
              )}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No listings found.</Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        <>
          {isLoadingRequests && !isRefetchingRequests ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.requestCard}
                  onPress={() => handleRequestClick(item.id)}
                >
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestTitle}>{item.listing?.title || 'Unknown Vehicle'}</Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.requestDates}>
                    <Text style={styles.requestDateText}>
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.requestCustomer}>Customer ID: {item.customerId}</Text>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl refreshing={isRefetchingRequests} onRefresh={refetchRequests} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No rental requests found.</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  header: {
    padding: Spacing.m,
    paddingTop: Spacing.l,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.m,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.dark.textMuted,
    marginTop: Spacing.xs,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
    gap: Spacing.s,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    color: Colors.dark.textMuted,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary[500],
    color: Colors.neutral[0],
    borderColor: Colors.primary[500],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: Spacing.m,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontFamily: Typography.fontFamily.regular,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  segmentText: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.dark.textMuted,
  },
  segmentTextActive: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.semiBold,
  },
  requestCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s,
  },
  requestTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
    fontSize: Typography.fontSize.m,
    flex: 1,
    marginRight: Spacing.s,
  },
  requestDates: {
    marginBottom: Spacing.xs,
  },
  requestDateText: {
    fontFamily: Typography.fontFamily.regular,
    color: Colors.dark.textMuted,
    fontSize: Typography.fontSize.s,
  },
  requestCustomer: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[400],
    fontSize: Typography.fontSize.s,
  }
});
