import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../../../theme/tokens';

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  imageUrl?: string;
  type: string;
  isSaved?: boolean;
  onPress: (id: string) => void;
  onSaveToggle: (id: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency,
  location,
  imageUrl,
  type,
  isSaved = false,
  onPress,
  onSaveToggle,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(id)}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="car-sport-outline" size={40} color={Colors.neutral[400]} />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => onSaveToggle(id)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={24}
            color={isSaved ? Colors.error[500] : Colors.neutral[0]}
          />
        </TouchableOpacity>
        
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{type}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <Text style={styles.price}>
          {currency} {price.toLocaleString()}
          <Text style={styles.pricePeriod}> / day</Text>
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={Colors.neutral[500]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={Colors.secondary[500]} />
            <Text style={styles.ratingText}>4.9 (12)</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
    ...Shadow.sm,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
  },
  content: {
    padding: Spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[900],
  },
  price: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.primary[600],
    marginBottom: Spacing.sm,
  },
  pricePeriod: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    marginLeft: 4,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[700],
  },
});
