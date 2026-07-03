import React from 'react';
import { View,  StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
  withKeyboardAvoidance?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  className = '',
  withKeyboardAvoidance = true
}) => {
  const content = (
    <View className={`flex-1 px-6 ${className}`}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      {withKeyboardAvoidance ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};
