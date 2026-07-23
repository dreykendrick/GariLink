import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/auth.store';
import { Svg, Path } from 'react-native-svg';
import { useSearchListings, useToggleFavourite } from '../../src/modules/marketplace/application/hooks';
import { ListingCard } from '../../src/modules/marketplace/presentation/components/listing-card';
import { CategorySelector, Category } from '../../src/modules/marketplace/presentation/components/category-selector';

const NotificationIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const SearchIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    fetchNextPage, 
    hasNextPage,
    refetch,
    isRefetching
  } = useSearchListings(selectedCategory === 'All' ? {} : { type: selectedCategory });

  const { mutate: toggleFavourite } = useToggleFavourite();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const listings = data?.pages.flatMap(page => page.data) || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.profile?.firstName || 'Guest'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <NotificationIcon color={Colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        onScroll={({ nativeEvent }) => {
          if (
            nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height >= 
            nativeEvent.contentSize.height - 400
          ) {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/explore')}
        >
          <SearchIcon color={Colors.dark.textMuted} />
          <Text style={styles.searchPlaceholder}>Search for cars, parts, services...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <CategorySelector 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </View>

        {/* Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'Featured Rentals' : `${selectedCategory} Rentals`}
            </Text>
          </View>
          
          <View style={styles.feedContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing.xl }} />
            ) : listings.length > 0 ? (
              listings.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={item.askingPrice}
                  currency={item.currency}
                  location={`${item.rentalConfig?.pickupCity || 'Unknown'}, ${item.rentalConfig?.pickupCounty || ''}`}
                  type={item.vehicle?.type || 'Vehicle'}
                  imageUrl={item.vehicle?.primaryImageId ? `https://api.garilink.com/media/${item.vehicle.primaryImageId}` : undefined}
                  onPress={(id) => router.push(`/listing/${id}`)}
                  onSaveToggle={(id) => toggleFavourite({ id, action: 'save' })}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No listings found in this category.</Text>
            )}
            
            {isFetchingNextPage && (
              <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginVertical: Spacing.lg }} />
            )}
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark.textMuted,
  },
  userName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.neutral[0],
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: Layout.screenPadding,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
  },
  searchPlaceholder: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.dark.textMuted,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xs,
  },
  feedContainer: {
    paddingHorizontal: Layout.screenPadding,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
