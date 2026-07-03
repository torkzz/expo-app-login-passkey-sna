import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authenticationManager } from '../services/AuthenticationManager';
import { AppLogo } from '../components/AppLogo';
import { ScreenContainer } from '../components/ScreenContainer';

export const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[Splash] Started');
        // Small delay to show logo
        await new Promise((resolve) => setTimeout(resolve, 1500));

        console.log('[Splash] Calling AuthenticationManager.initialize()');
        await authenticationManager.initialize();

        const isAuthenticated = authenticationManager.isAuthenticated();
        console.log(`[Splash] Initialization complete. Authenticated: ${isAuthenticated}`);

        if (isAuthenticated) {
          console.log('[Splash] Navigating to Dashboard');
          navigation.replace('Main');
        } else {
          console.log('[Splash] Navigating to Login');
          navigation.replace('Auth');
        }
      } catch (error) {
        console.error('[Splash] Critical failure during startup', error);
        // Guarantee navigation to Login even on failure
        navigation.replace('Auth');
      }
    };

    init();
  }, [navigation]);

  return (
    <ScreenContainer className="justify-center items-center">
      <AppLogo size={80} />
      <View className="mt-8">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    </ScreenContainer>
  );
};
