import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AuthService } from '../services/AuthService';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, authenticationMethod } = useAuthStore();

  const handleLogout = async () => {
    await AuthService.logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="flex-1 px-6">
        <View className="flex-row justify-between items-center py-6">
          <View>
            <Text className="text-gray-500">Welcome back,</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {user?.email || user?.phoneNumber || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="bg-primary p-6 rounded-3xl mb-8 shadow-lg shadow-blue-200">
          <Text className="text-blue-100 mb-1">Total Balance</Text>
          <Text className="text-white text-3xl font-bold">$12,450.00</Text>
          <View className="flex-row mt-6 space-x-4">
            <TouchableOpacity className="flex-1 bg-white/20 py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">Send</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white/20 py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">Receive</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-4">Security Info</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                  <MaterialCommunityIcons
                    name={authenticationMethod === 'passkey' ? 'fingerprint' : 'cellphone-check'}
                    size={24}
                    color="#0052cc"
                  />
                </View>
                <View>
                  <Text className="font-semibold text-gray-800">Auth Method</Text>
                  <Text className="text-gray-500 text-sm">Last used</Text>
                </View>
              </View>
              <Text className="font-bold text-primary capitalize">{authenticationMethod}</Text>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
                  <MaterialCommunityIcons name="shield-check" size={24} color="#10b981" />
                </View>
                <View>
                  <Text className="font-semibold text-gray-800">Security Status</Text>
                  <Text className="text-gray-500 text-sm">Protected by Verify</Text>
                </View>
              </View>
              <Text className="font-bold text-green-500">Active</Text>
            </View>
          </View>
        </View>

        <View>
          <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              { icon: 'bank', label: 'Transfers', color: '#3b82f6' },
              { icon: 'receipt', label: 'Bills', color: '#10b981' },
              { icon: 'credit-card', label: 'Cards', color: '#f59e0b' },
              { icon: 'history', label: 'History', color: '#6366f1' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                className="w-[48%] bg-white p-4 rounded-2xl mb-4 items-center shadow-sm"
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: item.color + '20' }}>
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text className="font-semibold text-gray-700">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
