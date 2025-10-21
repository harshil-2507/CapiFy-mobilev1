import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#f8fafc',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              console.log('🔙 Back button pressed - navigating to homepage');
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            style={{ 
              marginLeft: 16, 
              padding: 8,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
            <Text style={{ color: '#f8fafc', marginLeft: 4, fontSize: 14 }}>Home</Text>
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Expense Tracker',
          tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
