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

const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { loading } = useAuthStore();
  const [email, setEmail] = useState('');

  const handleRegister = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    try {
      await AuthService.registerPasskey(email);
      navigation.replace('Dashboard');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-8"
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="#374151" />
          </TouchableOpacity>

          <View className="mb-12">
            <Text className="text-3xl font-bold text-gray-900">Create Passkey</Text>
            <Text className="text-gray-500 mt-2">
              Passkeys provide a more secure and faster way to sign in using your biometrics.
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-gray-700 font-semibold mb-2">Email Address</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 h-14 bg-gray-50">
                <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-lg"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            <View className="bg-blue-50 p-4 rounded-xl mb-6">
              <View className="flex-row mb-2">
                <MaterialCommunityIcons name="shield-check" size={20} color="#0052cc" />
                <Text className="font-bold text-primary ml-2">Why Passkeys?</Text>
              </View>
              <Text className="text-gray-600 text-sm">
                • No passwords to remember{'\n'}
                • Protected by your device biometrics{'\n'}
                • Resistant to phishing and data breaches
              </Text>
            </View>

            <TouchableOpacity
              className={`h-14 rounded-xl flex-row items-center justify-center ${loading ? 'bg-blue-300' : 'bg-primary'}`}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="fingerprint" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">Register & Continue</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-1" />

          <TouchableOpacity
            className="mt-8 items-center"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-gray-500">Already have a passkey? <Text className="text-primary font-bold">Log In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
