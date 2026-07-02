import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authenticationManager } from '../services/AuthenticationManager';
import { AppLogo } from '../components/AppLogo';
import { ScreenContainer } from '../components/ScreenContainer';

export const SplashScreen = () => {
  useEffect(() => {
    const init = async () => {
      // Small delay to show logo
      await new Promise(resolve => setTimeout(resolve, 1500));
      await authenticationManager.initialize();
    };

    init();
  }, []);

  return (
    <ScreenContainer className="justify-center items-center">
      <AppLogo size={80} />
      <View className="mt-8">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    </ScreenContainer>
  );
};
