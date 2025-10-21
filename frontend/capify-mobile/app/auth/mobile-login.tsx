import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,  
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Color scheme (matching main app)
const Colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#10b981',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  card: '#334155',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const API_BASE_URL = 'http://10.167.75.155:8080';

export default function LoginScreen() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPIN] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnimation = new Animated.Value(0);

  const validateMobileNumber = (mobile: string): boolean => {
    const cleanMobile = mobile.replace(/\D/g, '');
    return cleanMobile.length === 10 && /^[6-9]\d{9}$/.test(cleanMobile);
  };

  const validatePIN = (pinValue: string): boolean => {
    return pinValue.length === 4 && /^\d{4}$/.test(pinValue);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    
    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!pin.trim()) {
      Alert.alert('Error', 'Please enter your 4-digit PIN');
      return;
    }

    if (!validatePIN(pin)) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Attempting login with PIN...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: `+91${mobileNumber}`,
          pin: pin,
        }),
      });

      const data = await response.json();
      console.log('🔍 Login Response:', data);

      if (data.success) {
        console.log('✅ Login successful!', {
          user: data.user?.name,
          accessToken: data.access_token?.substring(0, 20) + '...',
        });

        // Store tokens in AsyncStorage
        await AsyncStorage.setItem('userToken', data.access_token);
        await AsyncStorage.setItem('refreshToken', data.refresh_token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        // Show success toast
        showToast(`🎉 Welcome back, ${data.user?.name}!`);
        
        // Navigate after a short delay to let the toast show
        setTimeout(() => {
          console.log('🚀 Navigating to home...');
          router.replace('/(tabs)');
        }, 1000);
      } else {
        console.log('❌ Login failed:', data.message);
        Alert.alert('Login Failed', data.message || 'Invalid mobile number or PIN');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert(
        'Network Error', 
        'Failed to connect to server. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPIN = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number first');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      console.log('🔄 Requesting PIN reset...');
      
      const response = await fetch(`${API_BASE_URL}/auth/forgot-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: `+91${mobileNumber}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'OTP Sent! 📱',
          'We\'ve sent a PIN reset OTP to your mobile number. Please check your messages.',
          [
            {
              text: 'Go to Reset',
              onPress: () => router.push('/auth/reset-pin' as any),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send reset OTP');
      }
    } catch (error) {
      console.error('❌ Forgot PIN error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Welcome Back</Text>
              <Text style={styles.headerSubtitle}>
                Sign in to continue to CapiFy
              </Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your mobile number"
                  placeholderTextColor={Colors.textSecondary}
                  value={mobileNumber}
                  onChangeText={(text) => setMobileNumber(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* PIN Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PIN</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your 4-digit PIN"
                  placeholderTextColor={Colors.textSecondary}
                  value={pin}
                  onChangeText={setPIN}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry={!showPIN}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPIN(!showPIN)}>
                  <Ionicons 
                    name={showPIN ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot PIN Link */}
            <TouchableOpacity 
              style={styles.forgotPINButton}
              onPress={handleForgotPIN}
            >
              <Text style={styles.forgotPINText}>Forgot PIN?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Logging in...</Text>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={Colors.text} />
                    <Text style={styles.buttonText}>Login</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/mobile-signup' as any)}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Continue as Guest */}
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => router.push('/(tabs)' as any)}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.card,
  },
  countryCode: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  forgotPINButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPINText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.card,
    borderRadius: 12,
    marginBottom: 20,
  },
  guestButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: Colors.success,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  toastText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
