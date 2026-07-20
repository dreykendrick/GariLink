import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Layout } from '../../src/theme/tokens';
import { Svg, Path } from 'react-native-svg';

const SearchIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

const FilterIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </Svg>
);

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model, or year..."
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <FilterIcon color={Colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Browse by Make</Text>
        <View style={styles.makeGrid}>
          {['Toyota', 'Nissan', 'Honda', 'Subaru', 'Mazda', 'Mercedes', 'BMW', 'Audi'].map((make) => (
            <TouchableOpacity key={make} style={styles.makeCard}>
              <View style={styles.makeLogoPlaceholder} />
              <Text style={styles.makeName}>{make}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Recent Listings</Text>
        <View style={styles.listContainer}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.listingCard}>
              <View style={styles.listingImagePlaceholder}>
                <Text style={{color: Colors.neutral[500]}}>Car Image</Text>
              </View>
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>2018 Toyota Prado TX</Text>
                <Text style={styles.listingPrice}>KES 6,200,000</Text>
                <Text style={styles.listingDetails}>Diesel • Automatic • 45,000 km</Text>
              </View>
            </View>
          ))}
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
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.3xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes['2xl'],
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
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[0],
    marginLeft: Spacing.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.surface,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.2xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[0],
    marginBottom: Spacing.md,
  },
  makeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  makeCard: {
    width: '22%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  makeLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xs,
  },
  makeName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.sizes.xs,
    color: Colors.dark.text,
  },
  listContainer: {
    gap: Spacing.md,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    height: 110,
  },
  listingImagePlaceholder: {
    width: 140,
    backgroundColor: Colors.dark.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  listingTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[0],
    marginBottom: 4,
  },
  listingPrice: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes.md,
    color: Colors.primary[400],
    marginBottom: 8,
  },
  listingDetails: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.dark.textMuted,
  },
});
