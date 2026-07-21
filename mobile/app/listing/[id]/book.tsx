import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../../src/theme/tokens';
import { useCreateRentalRequest } from '../../../src/api/hooks/useRentals';
import { useListing } from '../../../src/modules/marketplace/application/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookRentalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: listing, isLoading: isLoadingListing } = useListing(id as string);
  const { mutate: createRequest, isPending } = useCreateRentalRequest();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');

  const handleBook = () => {
    if (!startDate || !endDate) return;
    
    createRequest({
      listingId: id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      pickupNotes,
    }, {
      onSuccess: () => {
        router.replace('/(tabs)/trips');
      }
    });
  };

  if (isLoadingListing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.neutral[0]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request to Book</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.vehicleSummary}>
          <Text style={styles.vehicleTitle}>{listing?.title}</Text>
          <Text style={styles.vehiclePrice}>{listing?.currency} {listing?.askingPrice.toLocaleString()} / day</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dates</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-08-01"
              placeholderTextColor={Colors.dark.textMuted}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-08-05"
              placeholderTextColor={Colors.dark.textMuted}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Pickup & Dropoff Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special requests or notes for the owner?"
              placeholderTextColor={Colors.dark.textMuted}
              value={pickupNotes}
              onChangeText={setPickupNotes}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <TouchableOpacity 
          style={[styles.submitButton, (!startDate || !endDate || isPending) && styles.submitButtonDisabled]}
          onPress={handleBook}
          disabled={!startDate || !endDate || isPending}
        >
          {isPending ? (
            <ActivityIndicator color={Colors.neutral[0]} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
  },
  scrollContent: {
    padding: Layout.screenPadding,
    paddingBottom: 100,
  },
  vehicleSummary: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
  },
  vehicleTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    marginBottom: Spacing.xs,
  },
  vehiclePrice: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.primary[400],
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[0],
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[200],
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.bg,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  submitButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.neutral[0],
    fontSize: Typography.fontSize.lg,
  },
});
