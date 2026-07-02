import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface ErrorBannerProps {
  message?: string;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <View className={`bg-red-50 border border-red-100 p-4 rounded-xl flex-row items-center mb-6 ${className}`}>
      {/* @ts-ignore */}
      <AlertCircle size={20} color="#DC2626" />
      <Text className="text-danger ml-2 flex-1 font-medium">{message}</Text>
    </View>
  );
};
