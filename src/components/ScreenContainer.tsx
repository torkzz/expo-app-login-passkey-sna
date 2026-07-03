import React from 'react';
import { View, SafeAreaView, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';

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
