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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

const API_BASE_URL = 'http://localhost:8080';

export default function LoginScreen() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');

  const validateMobileNumber = (mobile: string): boolean => {
    const cleanMobile = mobile.replace(/\D/g, '');
    return cleanMobile.length === 10 && /^[6-9]\d{9}$/.test(cleanMobile);
  };

  const sendOTP = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number (10 digits)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'OTP Sent!',
          `We've sent a verification code to ${mobileNumber}. Please check your messages.`,
          [
            {
              text: 'OK',
              onPress: () => setStep('otp'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
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
          mobile_number: mobileNumber,
          otp_code: otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens (in a real app, use secure storage)
        console.log('✅ Login successful!', {
          user: data.user,
          accessToken: data.access_token?.substring(0, 20) + '...',
        });

        Alert.alert(
          'Welcome Back! 👋',
          `Login successful! Welcome back ${data.user?.name}!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // TODO: Store tokens securely
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

  const renderMobileStep = () => (
    <>
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
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={sendOTP}
          />
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
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
        <Text style={styles.otpMobileNumber}>+91 {mobileNumber}</Text>
        <TouchableOpacity 
          onPress={() => setStep('mobile')}
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
        style={[styles.loginButton, otpLoading && styles.buttonDisabled]}
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
              <Ionicons name="log-in" size={20} color={Colors.text} />
              <Text style={styles.buttonText}>Verify & Sign In</Text>
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
              onPress={() => step === 'otp' ? setStep('mobile') : router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {step === 'mobile' ? 'Welcome Back' : 'Verify OTP'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {step === 'mobile'
                  ? 'Sign in to continue to CapiFy'
                  : 'Enter the verification code sent to your mobile'
                }
              </Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            {step === 'mobile' ? renderMobileStep() : renderOTPStep()}

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/mobile-signup' as any)}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Or Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest Access */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => {
                console.log('👤 Guest access selected');
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.guestButtonText}>
                Continue as Guest
              </Text>
            </TouchableOpacity>
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
  loginButton: {
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.card,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
  },
  guestButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.card,
    marginBottom: 20,
  },
  guestButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
