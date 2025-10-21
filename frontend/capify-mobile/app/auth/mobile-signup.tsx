import React, { useState, useEffect } from 'react';
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

const API_BASE_URL = 'https://renewed-achievement-production-eb97.up.railway.app';

// Test API connectivity on component mount
const testAPIConnection = async () => {
  try {
    console.log('🔍 Testing API connection to:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API connection test successful:', data);
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    console.log('🔧 Possible solutions:');
    console.log('1. Check if Railway backend is running');
    console.log('2. Verify the API URL is correct');
    console.log('3. Check network connectivity');
  }
};

interface FormData {
  fullName: string;
  mobileNumber: string;
  pin: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    mobileNumber: '',
    pin: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showPIN, setShowPIN] = useState(false);

  // Test API connection on component mount
  useEffect(() => {
    testAPIConnection();
  }, []);

  // Force re-render when step changes
  useEffect(() => {
    console.log('🔄 Step changed to:', step);
    setForceUpdate(prev => prev + 1);
  }, [step]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateMobileNumber = (mobile: string): boolean => {
    // Remove all non-digit characters
    const cleanMobile = mobile.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6,7,8,9)
    if (cleanMobile.length === 10 && /^[6-9]\d{9}$/.test(cleanMobile)) {
      return true;
    }
    
    // Check with country code
    if (cleanMobile.length === 12 && cleanMobile.startsWith('91') && /^91[6-9]\d{9}$/.test(cleanMobile)) {
      return true;
    }
    
    return false;
  };

  const validatePIN = (pin: string): boolean => {
    return pin.length === 4 && /^\d{4}$/.test(pin);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!formData.mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return false;
    }

    if (!validateMobileNumber(formData.mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number (10 digits)');
      return false;
    }

    if (!formData.pin.trim()) {
      Alert.alert('Error', 'Please enter your 4-digit PIN');
      return false;
    }

    if (!validatePIN(formData.pin)) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return false;
    }

    // Check for weak PINs
    if (/^(\d)\1{3}$/.test(formData.pin)) {
      Alert.alert('Weak PIN', 'Please choose a stronger PIN. Avoid using the same digit repeatedly.');
      return false;
    }

    if (['1234', '0123', '2345', '3456', '4567', '5678', '6789', '7890'].includes(formData.pin)) {
      Alert.alert('Weak PIN', 'Please choose a stronger PIN. Avoid sequential numbers.');
      return false;
    }

    return true;
  };

  const sendOTP = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('📤 Sending OTP request:', {
        mobile_number: formData.mobileNumber,
        url: `${API_BASE_URL}/auth/send-otp`
      });

      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: formData.mobileNumber,
        }),
      });

      console.log('📱 Send OTP Response Status:', response.status);
      
      const data = await response.json();

      console.log('📱 Send OTP Response Data:', data);

      if (response.ok && data.success) {
        console.log('✅ OTP sent successfully, moving to OTP step');
        
        // Move to OTP step immediately
        setStep('otp');
        
        // Show success alert after step change
        setTimeout(() => {
          Alert.alert(
            'OTP Sent! 📱',
            `We've sent a verification code to +91 ${formData.mobileNumber}.\n\nFor development, check the backend console for the OTP code.`,
            [{ text: 'Got it!' }]
          );
        }, 100);
      } else {
        console.log('❌ OTP send failed:', data);
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      Alert.alert(
        'Network Error', 
        'Failed to connect to server. Please check:\n• Backend server is running on port 8080\n• Your internet connection\n• Try again in a moment'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: formData.mobileNumber,
          otp_code: otp,
          name: formData.fullName,
          pin: formData.pin,
        }),
      });

      const data = await response.json();
      console.log('🔍 Verify OTP Response:', {
        status: response.status,
        success: data.success,
        user: data.user?.name,
        hasToken: !!data.access_token
      });

      if (data.success) {
        // Store tokens in AsyncStorage
        await AsyncStorage.setItem('userToken', data.access_token);
        await AsyncStorage.setItem('refreshToken', data.refresh_token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        console.log('✅ Registration successful!', {
          user: data.user,
          accessToken: data.access_token?.substring(0, 20) + '...',
        });

        // Visual success feedback first
        setStep('success');
        setForceUpdate(prev => prev + 1);

        // Show success alert
        Alert.alert(
          '🎉 Welcome to CapiFy!',
          `Account created successfully!\nWelcome ${data.user?.name}!`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                console.log('🚀 Navigating to home...');
                router.replace('/(tabs)');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOTP = async () => {
    setOtp('');
    await sendOTP();
  };

  const renderDetailsStep = () => (
    <>
      {/* Full Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your full name"
            placeholderTextColor={Colors.textSecondary}
            value={formData.fullName}
            onChangeText={(text) => handleInputChange('fullName', text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
      </View>

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
            value={formData.mobileNumber}
            onChangeText={(text) => handleInputChange('mobileNumber', text.replace(/\D/g, ''))}
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="next"
          />
        </View>
      </View>

      {/* PIN Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Create PIN</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your 4-digit PIN"
            placeholderTextColor={Colors.textSecondary}
            value={formData.pin}
            onChangeText={(text) => handleInputChange('pin', text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry={!showPIN}
            returnKeyType="done"
            onSubmitEditing={sendOTP}
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

      {/* Terms and Conditions */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
        onPress={sendOTP}
        disabled={isLoading}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isLoading ? (
            <Text style={styles.buttonText}>Sending OTP...</Text>
          ) : (
            <>
              <Ionicons name="arrow-forward" size={20} color={Colors.text} />
              <Text style={styles.buttonText}>Send OTP</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderOTPStep = () => (
    <>
      {/* OTP Information */}
      <View style={styles.otpInfoContainer}>
        <Text style={styles.otpInfoText}>
          We've sent a 6-digit verification code to
        </Text>
        <Text style={styles.otpMobileNumber}>+91 {formData.mobileNumber}</Text>
        <TouchableOpacity 
          onPress={() => setStep('details')}
          style={styles.changeNumberButton}
        >
          <Text style={styles.changeNumberText}>Change Number</Text>
        </TouchableOpacity>
      </View>

      {/* OTP Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Enter OTP</Text>
        <View style={styles.otpInputWrapper}>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor={Colors.textSecondary}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={verifyOTP}
          />
        </View>
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.signUpButton, otpLoading && styles.buttonDisabled]}
        onPress={verifyOTP}
        disabled={otpLoading}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {otpLoading ? (
            <Text style={styles.buttonText}>Verifying...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.text} />
              <Text style={styles.buttonText}>Verify & Create Account</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend OTP */}
      <TouchableOpacity
        style={styles.resendButton}
        onPress={resendOTP}
      >
        <Text style={styles.resendButtonText}>
          Didn't receive OTP? Resend
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderSuccessStep = () => (
    <>
      {/* Success Icon */}
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Welcome to CapiFy! 🎉</Text>
        <Text style={styles.successSubtitle}>
          Your account has been created successfully!
        </Text>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.successButton}
          onPress={() => {
            console.log('🚀 Navigating to home...');
            router.replace('/(tabs)');
          }}
        >
          <LinearGradient
            colors={[Colors.success, Colors.accent]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="arrow-forward" size={20} color={Colors.text} />
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

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
              onPress={() => {
                if (step === 'otp') setStep('details');
                else if (step === 'success') setStep('otp');
                else router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {step === 'details' ? 'Create Account' : 
                 step === 'otp' ? 'Verify OTP' : 'Welcome!'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {step === 'details' 
                  ? 'Join CapiFy and start managing your finances better'
                  : step === 'otp'
                  ? 'Enter the verification code sent to your mobile'
                  : 'Your account has been created successfully'
                }
              </Text>
              {/* Debug indicator */}
              <Text style={styles.debugText}>
                Current Step: {step} | Update: {forceUpdate}
              </Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Debug Panel */}
            <View style={styles.debugPanel}>
              <Text style={styles.debugTitle}>🔧 Debug Panel</Text>
              <Text style={styles.debugText}>Current Step: {step}</Text>
              <Text style={styles.debugText}>Force Update: {forceUpdate}</Text>
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => {
                  console.log('🔄 Manual step toggle');
                  if (step === 'details') setStep('otp');
                  else if (step === 'otp') setStep('success');
                  else setStep('details');
                }}
              >
                <Text style={styles.debugButtonText}>
                  Next Step
                </Text>
              </TouchableOpacity>
            </View>

            {step === 'details' ? renderDetailsStep() : 
             step === 'otp' ? renderOTPStep() : 
             renderSuccessStep()}

            {/* Sign In Link - only show on details and otp steps */}
            {step !== 'success' && (
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
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
    marginTop: 30,
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
  debugText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 8,
    textAlign: 'center',
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
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.card,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 16,
    paddingLeft: 12,
  },
  otpInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  otpInfoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpMobileNumber: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  changeNumberButton: {
    paddingVertical: 4,
  },
  changeNumberText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  otpInputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card,
  },
  otpInput: {
    color: Colors.text,
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  termsContainer: {
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  termsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  resendButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  signInText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  signInLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Debug Panel styles
  debugPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  debugTitle: {
    fontSize: 14,
    color: '#FFB800',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugButton: {
    backgroundColor: '#FFB800',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  successButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
