import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useListing, useToggleFavourite, useSavedListings } from '../../src/modules/marketplace/application/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: listing, isLoading, isError } = useListing(id as string);
  const { data: savedListings } = useSavedListings();
  const { mutate: toggleFavourite } = useToggleFavourite();

  const isSaved = savedListings?.some(item => item.id === id) || false;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Unable to load listing details.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = listing.vehicle?.primaryImageId ? `https://api.garilink.com/media/${listing.vehicle.primaryImageId}` : null;

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.neutral[0]} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color={Colors.neutral[0]} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { marginLeft: Spacing.sm }]}
            onPress={() => toggleFavourite({ id, action: isSaved ? 'remove' : 'save' })}
          >
            <Ionicons name={isSaved ? "heart" : "heart-outline"} size={24} color={isSaved ? Colors.error[500] : Colors.neutral[0]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car-sport-outline" size={64} color={Colors.neutral[400]} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{listing.vehicle?.type || 'Vehicle'}</Text>
            </View>
          </View>
          
          <Text style={styles.price}>
            {listing.currency} {listing.askingPrice.toLocaleString()}
            <Text style={styles.pricePeriod}> / day</Text>
          </Text>

          {/* Quick Specs */}
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.specText}>{listing.vehicle?.year || 'N/A'}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="settings-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.specText}>{listing.vehicle?.transmission || 'Auto'}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="water-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.specText}>{listing.vehicle?.fuelType || 'Petrol'}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.specText}>{listing.vehicle?.seats || 5} Seats</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          <View style={styles.divider} />

          {/* Location & Map Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color={Colors.primary[500]} />
              <Text style={styles.locationText}>
                {listing.rentalConfig?.pickupCity}, {listing.rentalConfig?.pickupCounty}
              </Text>
            </View>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color={Colors.neutral[500]} />
              <Text style={styles.mapPlaceholderText}>Maps will be available in a future update.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Rental Policies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Policies</Text>
            <View style={styles.policyItem}>
              <Ionicons name="cash-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.policyText}>Security Deposit: {listing.currency} {(listing.rentalConfig?.depositAmount || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.policyItem}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.policyText}>Fuel Policy: {listing.rentalConfig?.fuelPolicy || 'Full to Full'}</Text>
            </View>
            <View style={styles.policyItem}>
              <Ionicons name="time-outline" size={20} color={Colors.neutral[400]} />
              <Text style={styles.policyText}>Minimum Days: {listing.rentalConfig?.minimumRentalDays || 1} day(s)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Owner Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted By</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarText}>O</Text>
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>Owner Name</Text>
                <Text style={styles.ownerMeta}>Verified Member • 100% Response Rate</Text>
              </View>
            </View>
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.ownerButtonOutline}>
                <Ionicons name="call-outline" size={20} color={Colors.neutral[0]} />
                <Text style={styles.ownerButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ownerButtonPrimary}>
                <Ionicons name="logo-whatsapp" size={20} color={Colors.neutral[0]} />
                <Text style={styles.ownerButtonTextPrimary}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Fixed Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.footerPrice}>{listing.currency} {listing.askingPrice.toLocaleString()}</Text>
          <Text style={styles.footerPriceDesc}>Total per day</Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push(`/listing/${id}/book`)}
        >
          <Text style={styles.bookButtonText}>Request to Book</Text>
        </TouchableOpacity>
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
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.dark.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Layout.screenPadding,
    marginTop: -20,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.bg,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.neutral[0],
    marginRight: Spacing.sm,
  },
  typeBadge: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  typeText: {
    color: Colors.neutral[300],
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
  },
  price: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[400],
    marginBottom: Spacing.lg,
  },
  pricePeriod: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.dark.textMuted,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specText: {
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[300],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.lg,
  },
  section: {},
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[300],
    lineHeight: Typography.lineHeight.relaxed,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  locationText: {
    marginLeft: Spacing.sm,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[200],
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  mapPlaceholderText: {
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.dark.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  policyText: {
    marginLeft: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[300],
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  ownerAvatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
    color: Colors.neutral[0],
    marginBottom: 2,
  },
  ownerMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.success[500],
  },
  ownerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  ownerButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  ownerButtonText: {
    marginLeft: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[0],
  },
  ownerButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#25D366', // WhatsApp color
  },
  ownerButtonTextPrimary: {
    marginLeft: Spacing.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.bg,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  footerPriceInfo: {},
  footerPrice: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[400],
  },
  footerPriceDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.dark.textMuted,
  },
  bookButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
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
  }
});
