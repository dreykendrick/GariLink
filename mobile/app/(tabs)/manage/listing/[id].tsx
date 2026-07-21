import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMyListings, useUpdateListing, usePublishListing } from '../../../../src/api/hooks/useListings';
import { Colors, Typography, Spacing } from '../../../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../../../../src/components/ui/StatusBadge';

export default function ListingEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data, isLoading } = useMyListings();
  const updateMutation = useUpdateListing();
  const publishMutation = usePublishListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [askingPrice, setAskingPrice] = useState('');

  const listings = data?.items || [];
  const listing = listings.find((l: any) => l.id === id);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setAskingPrice(listing.askingPrice?.toString() || '');
    }
  }, [listing]);

  if (isLoading || !listing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({
      id,
      data: {
        title,
        description,
        askingPrice: askingPrice ? Number(askingPrice) : undefined,
      }
    }, {
      onSuccess: () => {
        router.back();
      }
    });
  };

  const handlePublish = () => {
    publishMutation.mutate(id, {
      onSuccess: () => {
        router.back();
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <Text style={styles.label}>Current Status</Text>
          <StatusBadge status={listing.status || 'draft'} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Listing Title"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Asking Price (TZS)</Text>
          <TextInput
            style={styles.input}
            value={askingPrice}
            onChangeText={setAskingPrice}
            keyboardType="numeric"
            placeholder="e.g. 50000"
            placeholderTextColor={Colors.dark.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Describe your vehicle..."
            placeholderTextColor={Colors.dark.textMuted}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {(listing.status === 'draft' || listing.status === 'DRAFT') && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.publishButton} 
            onPress={handlePublish}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? (
              <ActivityIndicator color={Colors.neutral[0]} />
            ) : (
              <Text style={styles.publishButtonText}>Publish Listing</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.card,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.l,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.dark.text,
  },
  saveButton: {
    fontSize: Typography.fontSize.m,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary[400],
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.m,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.l,
    padding: Spacing.m,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputGroup: {
    marginBottom: Spacing.l,
  },
  label: {
    fontSize: Typography.fontSize.s,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.dark.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    padding: Spacing.m,
    color: Colors.dark.text,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.m,
  },
  textArea: {
    height: 120,
  },
  footer: {
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.card,
  },
  publishButton: {
    backgroundColor: Colors.primary[500],
    padding: Spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButtonText: {
    color: Colors.neutral[0],
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.m,
  },
});
