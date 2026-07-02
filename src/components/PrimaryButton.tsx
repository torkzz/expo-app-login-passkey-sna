import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface PrimaryButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = 'primary',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white border border-primary';
      case 'danger':
        return 'bg-danger';
      case 'success':
        return 'bg-success';
      default:
        return 'bg-primary';
    }
  };

  const getTextStyle = () => {
    if (variant === 'secondary') return 'text-primary';
    return 'text-white';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`h-12 rounded-xl flex-row items-center justify-center px-4 ${getVariantStyles()} ${
        disabled || loading ? 'opacity-50' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#2563EB' : 'white'} />
      ) : (
        <Text className={`font-semibold text-base ${getTextStyle()}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
