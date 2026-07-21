import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ListingStatus = 'draft' | 'published' | 'paused' | 'archived';

interface StatusBadgeProps {
  status: ListingStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'active':
        return { bg: '#E6F4EA', text: '#137333' }; // Green
      case 'draft':
        return { bg: '#F1F3F4', text: '#5F6368' }; // Gray
      case 'paused':
        return { bg: '#FEF7E0', text: '#B06000' }; // Yellow/Orange
      case 'archived':
        return { bg: '#FCE8E6', text: '#C5221F' }; // Red
      default:
        return { bg: '#F1F3F4', text: '#5F6368' }; // Default Gray
    }
  };

  const styles = getStatusStyles();

  return (
    <View style={[badgeStyles.container, { backgroundColor: styles.bg }]}>
      <Text style={[badgeStyles.text, { color: styles.text }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
