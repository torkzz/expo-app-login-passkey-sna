import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { authenticationManager } from '../services/AuthenticationManager';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppLogo } from '../components/AppLogo';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInput } from '../components/TextInput';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Fingerprint, Smartphone } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasskeyLogin = async () => {
    if (!identifier) {
      setError('Please enter your username or mobile number');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await authenticationManager.loginWithPasskey(identifier);
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Passkey login failed');
    }
  };

  const handleSNALogin = async () => {
    if (!identifier) {
      setError('Please enter your mobile number');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await authenticationManager.loginWithSNA(identifier);
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'SNA login failed');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 pt-12 pb-8">
          <View className="items-center mb-10">
            <AppLogo />
            <Text className="text-2xl font-bold text-text mt-4">Welcome Back</Text>
            <Text className="text-text-secondary mt-2">Sign in to your account</Text>
          </View>

          <ErrorBanner message={error || undefined} />

          <TextInput
            label="Username or Mobile Number"
            placeholder="e.g. john_doe or +639..."
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (error) setError(null);
            }}
          />

          <View className="mt-4 space-y-4">
            <PrimaryButton
              title="Continue with Passkey"
              onPress={handlePasskeyLogin}
              variant="primary"
            />

            <PrimaryButton
              title="Sign in with Mobile Network"
              onPress={handleSNALogin}
              variant="secondary"
              className="mt-3"
            />
          </View>

          <View className="flex-1" />

          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-text-secondary">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary font-semibold">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </ScreenContainer>
  );
};
