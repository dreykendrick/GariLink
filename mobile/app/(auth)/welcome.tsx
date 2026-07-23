import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme/tokens';

export default function WelcomeScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>G</Text>
        </View>
        <Text style={styles.brandName}>GariLink</Text>
        <Text style={styles.tagline}>East Africa's Automotive Marketplace</Text>
      </View>

      {/* Hero illustration placeholder */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🚗 Buy · Sell · Rent</Text>
        </View>
        <Text style={styles.heroTitle}>Find Your Perfect Vehicle</Text>
        <Text style={styles.heroSubtitle}>
          Browse thousands of verified listings across Kenya, Uganda, Tanzania, and Rwanda.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </Pressable>

        <Pressable
          style={styles.browseButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.browseButtonText}>Browse without signing in →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
  },

  logoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.bold,
  },
  brandName: {
    fontSize: Typography.fontSize['3xl'],
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    color: Colors.dark.textMuted,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },

  heroSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroBadge: {
    backgroundColor: Colors.primary[900],
    borderWidth: 1,
    borderColor: Colors.primary[700],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  heroBadgeText: {
    color: Colors.primary[300],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  heroTitle: {
    fontSize: Typography.fontSize['4xl'],
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark.textMuted,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * 1.6,
  },

  actions: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: Colors.primary[700],
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: Colors.neutral[0],
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  secondaryButtonPressed: {
    backgroundColor: Colors.dark.surface,
  },
  secondaryButtonText: {
    color: Colors.dark.text,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  browseButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  browseButtonText: {
    color: Colors.dark.textMuted,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
