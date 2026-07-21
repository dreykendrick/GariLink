import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../../../theme/tokens';

export type Category = 'SUV' | 'Sedan' | 'Pickup' | 'Luxury' | 'Truck' | 'Bus' | 'Van' | 'Motorcycle' | 'All';

interface CategorySelectorProps {
  categories?: Category[];
  selectedCategory: Category;
  onSelect: (category: Category) => void;
}

const DEFAULT_CATEGORIES: Category[] = ['All', 'SUV', 'Sedan', 'Pickup', 'Luxury', 'Truck', 'Bus', 'Van', 'Motorcycle'];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              activeOpacity={0.7}
              onPress={() => onSelect(category)}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
    ...Shadow.sm,
  },
  categoryText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[600],
  },
  categoryTextSelected: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.semiBold,
  },
});
