import React from 'react';
import { View, Text, TextInput as RNTextInput, KeyboardTypeOptions } from 'react-native';

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  className = '',
}) => {
  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-text font-medium mb-1.5 ml-1">{label}</Text>}
      <View
        className={`bg-white border rounded-xl px-4 h-12 justify-center ${
          error ? 'border-danger' : 'border-gray-200 focus:border-primary'
        }`}
      >
        <RNTextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          className="text-text text-base"
          placeholderTextColor="#94A3B8"
        />
      </View>
      {error && <Text className="text-danger text-sm mt-1 ml-1">{error}</Text>}
    </View>
  );
};
