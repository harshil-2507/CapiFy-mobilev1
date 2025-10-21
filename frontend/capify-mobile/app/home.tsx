import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Color scheme
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

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  iconType: 'ionicons' | 'material' | 'fontawesome';
  color: string;
  onPress: () => void;
  isComingSoon?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  iconType,
  color,
  onPress,
  isComingSoon = false,
}) => {
  const renderIcon = () => {
    const iconSize = 32;
    switch (iconType) {
      case 'ionicons':
        return <Ionicons name={icon as any} size={iconSize} color={color} />;
      case 'material':
        return <MaterialIcons name={icon as any} size={iconSize} color={color} />;
      case 'fontawesome':
        return <FontAwesome5 name={icon as any} size={iconSize} color={color} />;
      default:
        return <Ionicons name="apps" size={iconSize} color={color} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.featureCard, isComingSoon && styles.featureCardDisabled]}
      onPress={onPress}
      disabled={isComingSoon}
      activeOpacity={0.8}
    >
      <View style={styles.featureIconContainer}>
        {renderIcon()}
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
      {isComingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface HomeScreenProps {
  navigation: any; // Replace with proper navigation type
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const features = [
    {
      title: 'Personal Expenses',
      description: 'Track your daily expenses with smart budgets, analytics, and detailed insights',
      icon: 'wallet',
      iconType: 'ionicons' as const,
      color: Colors.accent,
      route: 'ExpenseTracker',
      isComingSoon: false,
    },
    {
      title: 'Group Expenses',
      description: 'Split bills with friends, track shared expenses, and settle balances easily',
      icon: 'people',
      iconType: 'ionicons' as const,
      color: Colors.primary,
      route: 'GroupExpenses',
      isComingSoon: true,
    },
  ];

  const handleFeaturePress = (feature: any) => {
    if (feature.isComingSoon) {
      // Show coming soon message for group expenses
      console.log(`🔜 ${feature.title} is coming soon in Phase 3!`);
      return;
    }
    
    // Navigate to expense tracker for personal expenses
    console.log(`🚀 Opening ${feature.title}`);
    navigation.navigate('ExpenseTracker');
  };

  const handleAuthAction = (action: 'login' | 'register') => {
    // For now, just navigate to expense tracker
    // Later, implement proper authentication
    navigation.navigate('ExpenseTracker');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Section */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>💰</Text>
              <Text style={styles.appName}>CapiFy</Text>
            </View>
            <Text style={styles.tagline}>
              Your Complete Financial Management Suite
            </Text>
            <Text style={styles.subtitle}>
              Track expenses • Manage budgets • Split bills • Grow wealth
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.primaryButton]}
              onPress={() => handleAuthAction('register')}
            >
              <Ionicons name="person-add" size={20} color={Colors.text} />
              <Text style={styles.quickActionText}>Sign Up Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.secondaryButton]}
              onPress={() => handleAuthAction('login')}
            >
              <Ionicons name="log-in" size={20} color={Colors.primary} />
              <Text style={[styles.quickActionText, { color: Colors.primary }]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('ExpenseTracker')}
          >
            <Text style={styles.guestButtonText}>
              Continue as Guest →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                iconType={feature.iconType}
                color={feature.color}
                onPress={() => handleFeaturePress(feature)}
                isComingSoon={feature.isComingSoon}
              />
            ))}
          </View>
        </View>

        {/* Stats Preview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Why Choose CapiFy?</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₹50L+</Text>
              <Text style={styles.statLabel}>Tracked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for better financial management
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    marginRight: 12,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  quickActionsContainer: {
    padding: 20,
    marginTop: -40,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  featuresContainer: {
    padding: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 180,
    position: 'relative',
  },
  featureCardDisabled: {
    opacity: 0.6,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.background,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
});

export default HomeScreen;
