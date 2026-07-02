import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AuthService } from '../services/AuthService';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { loading } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSNA = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    try {
      await AuthService.loginWithSNA(phoneNumber);
      navigation.replace('Dashboard');
    } catch (err: any) {
      Alert.alert('SNA Login Failed', err.message);
    }
  };

  const handlePasskey = async () => {
    try {
      await AuthService.loginWithPasskey();
      navigation.replace('Dashboard');
    } catch (err: any) {
      Alert.alert(
        'Passkey Login',
        'Could not find a passkey. Would you like to register one?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Register', onPress: () => navigation.navigate('Register') }
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">V</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
            <Text className="text-gray-500 mt-2 text-center">
              Securely access your account using mobile network or passkey.
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-gray-700 font-semibold mb-2">Phone Number</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 h-14 bg-gray-50">
                <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-lg"
                  placeholder="+63 9xx xxx xxxx"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              className={`h-14 rounded-xl flex-row items-center justify-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
              onPress={handleSNA}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="cellphone-check" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">Continue with Mobile Network</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-4">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-400">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            <TouchableOpacity
              className="h-14 rounded-xl border-2 border-primary flex-row items-center justify-center"
              onPress={handlePasskey}
              disabled={loading}
            >
              <MaterialCommunityIcons name="fingerprint" size={24} color="#0052cc" />
              <Text className="text-primary text-lg font-bold ml-2">Continue with Passkey</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1" />

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600">New user? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary font-bold">Register Passkey</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
