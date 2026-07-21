import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useSearchListings } from '../../src/modules/marketplace/application/hooks';
import { ListingCard } from '../../src/modules/marketplace/presentation/components/listing-card';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setFilterVisible] = useState(false);
  
  // Basic filters state
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    county: '',
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchListings({
    query: searchQuery,
    ...filters,
  });

  const listings = data?.pages.flatMap(page => page.data) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model, or year..."
            placeholderTextColor={Colors.dark.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options" size={24} color={Colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        onScroll={({ nativeEvent }) => {
          if (
            nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height >= 
            nativeEvent.contentSize.height - 400
          ) {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }
        }}
        scrollEventThrottle={400}
      >
        <Text style={styles.sectionTitle}>Search Results</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing.xl }} />
        ) : listings.length > 0 ? (
          <View style={styles.listContainer}>
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
                onPress={(id) => router.push(`/listing/${id}`)}
                onSaveToggle={(id) => {}}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.neutral[500]} />
            <Text style={styles.emptyTitle}>No vehicles found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
          </View>
        )}
        
        {isFetchingNextPage && (
          <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginVertical: Spacing.lg }} />
        )}
      </ScrollView>

      {/* Filter Bottom Sheet Modal */}
      <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral[0]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.filterLabel}>County</Text>
              <TextInput 
                style={styles.filterInput}
                placeholder="e.g. Nairobi"
                placeholderTextColor={Colors.dark.textMuted}
                value={filters.county}
                onChangeText={(t) => setFilters(prev => ({...prev, county: t}))}
              />
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setFilters({ minPrice: '', maxPrice: '', county: '' })}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setFilterVisible(false)}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.neutral[0],
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[0],
    marginLeft: Spacing.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    marginBottom: Spacing.md,
  },
  listContainer: {
    gap: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing['4xl'],
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    marginTop: Spacing.md,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.dark.textMuted,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.dark.bg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  sheetTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.neutral[0],
  },
  sheetContent: {
    padding: Spacing.lg,
  },
  filterLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[300],
    marginBottom: Spacing.xs,
  },
  filterInput: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    height: 48,
    paddingHorizontal: Spacing.md,
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.lg,
  },
  sheetFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  resetButtonText: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.medium,
  },
  applyButton: {
    flex: 2,
    height: 48,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  applyButtonText: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.semiBold,
  }
});
