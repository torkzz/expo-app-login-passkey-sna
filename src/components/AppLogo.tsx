import React from 'react';
import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 64, className = '' }) => {
  return (
    <View className={`items-center justify-center ${className}`}>
      <View className="bg-primary/10 p-4 rounded-3xl">
        {/* @ts-ignore */}
        <ShieldCheck size={size} color="#2563EB" strokeWidth={2.5} />
      </View>
    </View>
  );
};
