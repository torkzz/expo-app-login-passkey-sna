import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { authenticationManager } from '../services/AuthenticationManager';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInput } from '../components/TextInput';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegistrationSchema, RegistrationFormValues } from '../validation/auth';
import { ChevronLeft } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      username: '',
      mobileNumber: '',
    },
  });

const onRegister = async (data: RegistrationFormValues) => {
  try {
    setError(null);
    setLoading(true);

    console.log("Register clicked", data);

    const result = await authenticationManager.registerWithPasskey(
      data.username,
      data.mobileNumber
    );

    console.log("Register result", result);

    if (!result.success) {
      setError(result.message ?? "Registration failed");
    }
  } catch (e) {
    console.error("Registration exception", e);

    setError(
      e instanceof Error ? e.message : "Unknown registration error"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <ScreenContainer>
      <View className="flex-row items-center py-4 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          {/* @ts-ignore */}
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text ml-2">Create Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 pb-8">
          <Text className="text-text-secondary mb-8">
            Create a secure account using your mobile number and a Passkey.
          </Text>

          <ErrorBanner message={error || undefined} />

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Username"
                placeholder="Choose a username"
                value={value}
                onChangeText={onChange}
                error={errors.username?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="mobileNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Mobile Number"
                placeholder="e.g. +639..."
                value={value}
                onChangeText={onChange}
                error={errors.mobileNumber?.message}
                keyboardType="phone-pad"
              />
            )}
          />

          <View className="mt-6">
            <PrimaryButton
              title="Register with Passkey"
              onPress={handleSubmit(onRegister)}
              loading={loading}
            />
          </View>
        </View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Registering Passkey..." />
    </ScreenContainer>
  );
};
