import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AuthService } from '../services/AuthService';
import { useAuthStore } from '../store/authStore';

const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { authenticated } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await AuthService.restoreSession();
      // Small delay for branding visibility
      setTimeout(() => {
        if (useAuthStore.getState().authenticated) {
          navigation.replace('Dashboard');
        } else {
          navigation.replace('Login');
        }
      }, 2000);
    };
    init();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="items-center">
        <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center mb-4">
          <Text className="text-white text-4xl font-bold">V</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-800">Verify Demo</Text>
        <ActivityIndicator size="large" color="#0052cc" className="mt-8" />
      </View>
    </View>
  );
};

export default SplashScreen;
