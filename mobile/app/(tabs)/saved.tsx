import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Layout } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/stores/auth.store';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';

const HeartIcon = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

export default function SavedScreen() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.iconCircle}>
          <HeartIcon color={Colors.primary[400]} />
        </View>
        <Text style={styles.emptyTitle}>Save your favorites</Text>
        <Text style={styles.emptyText}>Log in to save vehicles you're interested in and view them later.</Text>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.buttonPrimaryText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Placeholder for empty state when authenticated but no saved items
  const hasSavedItems = true;

  if (!hasSavedItems) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.iconCircle}>
          <HeartIcon color={Colors.dark.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No saved vehicles</Text>
        <Text style={styles.emptyText}>Vehicles you save will appear here.</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.buttonSecondaryText}>Explore Vehicles</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {[1, 2].map((item) => (
          <View key={item} style={styles.listingCard}>
            <View style={styles.listingImagePlaceholder}>
              <Text style={{color: Colors.neutral[500]}}>Car Image</Text>
              <TouchableOpacity style={styles.favoriteButton}>
                <HeartIcon color={Colors.primary[400]} filled />
              </TouchableOpacity>
            </View>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>2020 Mazda CX-5</Text>
              <Text style={styles.listingPrice}>KES 3,800,000</Text>
              <Text style={styles.listingDetails}>Nairobi • Automatic • Petrol</Text>
            </View>
          </View>
        ))}
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
  listContainer: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
    paddingBottom: Spacing.2xl,
  },
  listingCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  listingImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.dark.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    padding: Spacing.md,
  },
  listingTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[0],
    marginBottom: 4,
  },
  listingPrice: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.primary[400],
    marginBottom: 8,
  },
  listingDetails: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.dark.textMuted,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPadding,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.sizes.xl,
    color: Colors.neutral[0],
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.sizes.md,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary[500],
    height: 48,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonPrimaryText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
    fontSize: Typography.sizes.md,
  },
  buttonSecondary: {
    backgroundColor: Colors.dark.surface,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  buttonSecondaryText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
    fontSize: Typography.sizes.md,
  },
});
