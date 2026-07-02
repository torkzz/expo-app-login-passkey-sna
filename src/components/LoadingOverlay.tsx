import React from 'react';
import { View, Modal, ActivityIndicator, Text } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Loading...' }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="bg-white p-6 rounded-2xl items-center min-w-[140px]">
          <ActivityIndicator size="large" color="#2563EB" />
          {message && <Text className="mt-4 text-text font-medium text-center">{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};
