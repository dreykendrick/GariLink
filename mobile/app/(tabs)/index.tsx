import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/auth.store';
import { useState, useCallback } from 'react';
import { Svg, Path } from 'react-native-svg';

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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
      >
        {/* Search Bar (Fake) */}
        <TouchableOpacity 
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <SearchIcon color={Colors.dark.textMuted} />
          <Text style={styles.searchPlaceholder}>Search for cars, parts, services...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {['Cars for Sale', 'Rentals', 'Parts & Spares', 'Garages', 'Insurance'].map((cat, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <View style={styles.categoryIconPlaceholder} />
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Vehicles</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredContainer}>
            {[1, 2, 3].map((item) => (
              <TouchableOpacity key={item} style={styles.featuredCard}>
                <View style={styles.featuredImagePlaceholder}>
                  <Text style={{color: Colors.neutral[500]}}>Image</Text>
                </View>
                <View style={styles.featuredDetails}>
                  <Text style={styles.featuredTitle}>2022 Toyota Hilux</Text>
                  <Text style={styles.featuredPrice}>KES 4,500,000</Text>
                  <Text style={styles.featuredMeta}>Nairobi • Automatic • Diesel</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity or Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <View style={styles.recommendedCard}>
            <Text style={styles.recommendedTitle}>Complete your profile</Text>
            <Text style={styles.recommendedText}>Add your details to get personalized recommendations and better trust scores.</Text>
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.buttonPrimaryText}>Update Profile</Text>
            </TouchableOpacity>
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
    paddingTop: Spacing.3xl,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.dark.textMuted,
  },
  userName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes.xl,
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
    paddingBottom: Spacing.3xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: Layout.screenPadding,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
  },
  searchPlaceholder: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.md,
    color: Colors.dark.textMuted,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.2xl,
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
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[0],
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[400],
  },
  categoriesContainer: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.sizes.xs,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  featuredContainer: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
  },
  featuredCard: {
    width: 280,
    backgroundColor: Colors.dark.surface,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.dark.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredDetails: {
    padding: Spacing.md,
  },
  featuredTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[0],
    marginBottom: 4,
  },
  featuredPrice: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes.lg,
    color: Colors.primary[400],
    marginBottom: 8,
  },
  featuredMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.dark.textMuted,
  },
  recommendedCard: {
    marginHorizontal: Layout.screenPadding,
    backgroundColor: Colors.primary[900],
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  recommendedTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes.md,
    color: Colors.primary[100],
    marginBottom: Spacing.xs,
  },
  recommendedText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.primary[200],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary[500],
    height: 40,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
    fontSize: Typography.sizes.sm,
  },
});
