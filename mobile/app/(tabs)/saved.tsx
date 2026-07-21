import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme/tokens';
import { useSavedListings, useToggleFavourite } from '../../src/modules/marketplace/application/hooks';
import { ListingCard } from '../../src/modules/marketplace/presentation/components/listing-card';
import { Ionicons } from '@expo/vector-icons';

export default function SavedScreen() {
  const router = useRouter();
  
  const { 
    data: listings, 
    isLoading, 
    refetch,
    isRefetching
  } = useSavedListings();

  const { mutate: toggleFavourite } = useToggleFavourite();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Listings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing['3xl'] }} />
        ) : listings && listings.length > 0 ? (
          <View style={styles.feedContainer}>
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.askingPrice}
                currency={item.currency}
                location={`${item.rentalConfig?.pickupCity || 'Unknown'}, ${item.rentalConfig?.pickupCounty || ''}`}
                type={item.vehicle?.type || 'Vehicle'}
                imageUrl={item.vehicle?.primaryImageId ? `https://api.garilink.com/media/${item.vehicle.primaryImageId}` : undefined}
                isSaved={true}
                onPress={(id) => router.push(`/listing/${id}`)}
                onSaveToggle={(id) => toggleFavourite({ id, action: 'remove' })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="heart-outline" size={48} color={Colors.neutral[400]} />
            </View>
            <Text style={styles.emptyTitle}>No saved listings yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on any listing to save it here for later.
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
