import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { authenticationManager } from '../services/AuthenticationManager';
import { useAuthStore } from '../store/authStore';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppLogo } from '../components/AppLogo';
import { User, LogOut, Shield, Smartphone } from 'lucide-react-native';

export const DashboardScreen = () => {
  const user = useAuthStore((state) => state.user);

  // In a real app, we might track the last method in the store
  const authMethod = user?.mobileNumber ? 'SNA' : 'Passkey';

  const handleLogout = async () => {
    await authenticationManager.logout();
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 py-8">
          <View className="flex-row justify-between items-center mb-8">
            <AppLogo size={32} />
            <PrimaryButton
              title="Logout"
              onPress={handleLogout}
              variant="secondary"
              className="h-10 px-4 border-none"
            />
          </View>

          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <View className="bg-primary/10 w-12 h-12 rounded-2xl items-center justify-center mb-4">
              {/* @ts-ignore */}
              <User size={24} color="#2563EB" />
            </View>
            <Text className="text-text-secondary text-sm">Welcome back,</Text>
            <Text className="text-2xl font-bold text-text mt-1">
              {user?.username || user?.id || 'User'}
            </Text>
          </View>

          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-text font-bold mb-4">Security Status</Text>

            <View className="flex-row items-center p-4 bg-slate-50 rounded-2xl mb-4">
              {/* @ts-ignore */}
              <Shield size={20} color="#16A34A" />
              <View className="ml-3">
                <Text className="text-text font-medium">Identity Verified</Text>
                <Text className="text-text-secondary text-xs">Verified via {authMethod}</Text>
              </View>
            </View>

            <View className="flex-row items-center p-4 bg-slate-50 rounded-2xl">
              {/* @ts-ignore */}
              <Smartphone size={20} color="#2563EB" />
              <View className="ml-3">
                <Text className="text-text font-medium">Device Linked</Text>
                <Text className="text-text-secondary text-xs">
                  {user?.mobileNumber || 'Biometric Device'}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <Text className="text-text font-bold mb-2">Account Details</Text>
            <View className="space-y-4">
              <View className="flex-row justify-between py-2 border-b border-gray-50">
                <Text className="text-text-secondary">User ID</Text>
                <Text className="text-text font-medium">{user?.id}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-text-secondary">Environment</Text>
                <Text className="text-success font-medium uppercase text-xs">Production</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};
