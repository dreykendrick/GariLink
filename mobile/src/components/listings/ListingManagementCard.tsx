import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBadge } from '../ui/StatusBadge';
import { Listing } from '../../types/api.types';
import { Ionicons } from '@expo/vector-icons';

interface ListingManagementCardProps {
  listing: Listing;
  onPress: () => void;
  onPublish?: () => void;
  onPause?: () => void;
  onRestore?: () => void;
}

export const ListingManagementCard: React.FC<ListingManagementCardProps> = ({
  listing,
  onPress,
  onPublish,
  onPause,
  onRestore,
}) => {
  const title = listing.title || 'Untitled Listing';
  const price = listing.askingPrice ? `$${listing.askingPrice.toLocaleString()}` : 'Price not set';
  const status = listing.status || 'draft';
  const imageUrl = listing.images?.[0]?.url || 'https://via.placeholder.com/150';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.contentContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.details}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          <Text style={styles.price}>{price}</Text>
          <View style={styles.statusRow}>
            <StatusBadge status={status} />
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        {status === 'draft' && onPublish && (
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={onPublish}>
            <Ionicons name="cloud-upload-outline" size={16} color="#FFF" />
            <Text style={styles.primaryButtonText}>Publish</Text>
          </TouchableOpacity>
        )}
        {status === 'published' && onPause && (
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onPause}>
            <Ionicons name="pause-circle-outline" size={16} color="#0A2540" />
            <Text style={styles.secondaryButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
        {status === 'paused' && onPublish && (
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={onPublish}>
            <Ionicons name="play-circle-outline" size={16} color="#FFF" />
            <Text style={styles.primaryButtonText}>Resume</Text>
          </TouchableOpacity>
        )}
        {status === 'archived' && onRestore && (
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onRestore}>
            <Ionicons name="refresh-outline" size={16} color="#0A2540" />
            <Text style={styles.secondaryButtonText}>Restore</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} onPress={onPress}>
          <Ionicons name="create-outline" size={20} color="#636E72" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A2540',
    flex: 1,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#137333',
    marginBottom: 8,
  },
  statusRow: {
    alignItems: 'flex-start',
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    padding: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: '#0A2540',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  secondaryButton: {
    backgroundColor: '#E4E8EC',
  },
  secondaryButtonText: {
    color: '#0A2540',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8EC',
  },
});
