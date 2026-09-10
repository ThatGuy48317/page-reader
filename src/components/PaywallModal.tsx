import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { TIERS } from '@/constants/monetization';
import { fetchOfferings, purchaseSubscriptionPackage, restoreUserPurchases } from '@/lib/purchases';
import { PurchasesPackage } from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaywallModal({ visible, onClose, onSuccess }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [packages, setPackages] = useState<{ monthly?: PurchasesPackage; annual?: PurchasesPackage }>({});

  useEffect(() => {
    if (!visible) return;
    const loadPackages = async () => {
      const offering = await fetchOfferings();
      if (offering) {
        setPackages({
          monthly: offering.monthly || undefined,
          annual: offering.annual || undefined,
        });
      }
    };
    loadPackages();
  }, [visible]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const targetPackage = selectedPlan === 'annual' ? packages.annual : packages.monthly;
      if (targetPackage) {
        const res = await purchaseSubscriptionPackage(targetPackage);
        if (res.success) {
          Alert.alert('Welcome to Pro!', 'Your subscription is active. Enjoy unlimited audiobook creation.');
          onSuccess?.();
          onClose();
        }
      } else {
        // Fallback for Sandbox / Demo mode before RevenueCat keys are configured
        setTimeout(() => {
          Alert.alert('Demo Pro Plan Activated', 'You have successfully subscribed to PaperEcho Pro (Sandbox Mode).');
          onSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (e: any) {
      console.error('Subscription error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await restoreUserPurchases();
      if (res.isPro) {
        Alert.alert('Purchases Restored', 'Your PaperEcho Pro subscription has been restored.');
        onSuccess?.();
        onClose();
      } else {
        Alert.alert('No Active Subscription', 'No active Pro subscription was found for this account.');
      }
    } catch (e) {
      console.error('Restore error:', e);
    } finally {
      setRestoring(false);
    }
  };

  const proFeatures = TIERS.pro.features;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close Icon */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header Badge & Title */}
            <View style={styles.header}>
              <View style={styles.badgeWrap}>
                <Ionicons name="sparkles" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Unlock PaperEcho Pro</Text>
              <Text style={styles.subtitle}>
                Digitize unlimited books with priority multimodal AI processing & multi-narrator ensemble cast.
              </Text>
            </View>

            {/* Plan Options Selector */}
            <View style={styles.plansContainer}>
              {/* Annual Plan (Featured) */}
              <TouchableOpacity 
                style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]} 
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.85}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 25%</Text>
                </View>
                <View style={styles.planHeaderRow}>
                  <Text style={styles.planName}>Annual Subscription</Text>
                  <Ionicons 
                    name={selectedPlan === 'annual' ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={selectedPlan === 'annual' ? Colors.primary : Colors.textTertiary} 
                  />
                </View>
                <Text style={styles.planPrice}>$89.99 <Text style={styles.planPeriod}>/ year</Text></Text>
                <Text style={styles.planBreakdown}>Just $7.50 / month, billed annually</Text>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity 
                style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]} 
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.85}
              >
                <View style={styles.planHeaderRow}>
                  <Text style={styles.planName}>Monthly Subscription</Text>
                  <Ionicons 
                    name={selectedPlan === 'monthly' ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={selectedPlan === 'monthly' ? Colors.primary : Colors.textTertiary} 
                  />
                </View>
                <Text style={styles.planPrice}>$9.99 <Text style={styles.planPeriod}>/ month</Text></Text>
                <Text style={styles.planBreakdown}>Flexible monthly billing, cancel anytime</Text>
              </TouchableOpacity>
            </View>

            {/* Pro Features List */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>PRO INCLUDES:</Text>
              {proFeatures.map((feat, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle-sharp" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>

            {/* Subscribe Action Button */}
            <TouchableOpacity 
              style={styles.subscribeButton} 
              onPress={handleSubscribe}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="sparkles" size={18} color="#000000" style={{ marginRight: 8 }} />
                  <Text style={styles.subscribeButtonText}>
                    {selectedPlan === 'annual' ? 'Start Annual Pro ($89.99/yr)' : 'Start Monthly Pro ($9.99/mo)'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footerRow}>
              <TouchableOpacity onPress={handleRestore} disabled={restoring} activeOpacity={0.7}>
                <Text style={styles.footerLink}>
                  {restoring ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Keep Free Tier</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.disclaimerText}>
              Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in App Store Settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badgeWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  plansContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  planCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.08)',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  saveBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  planPrice: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  planBreakdown: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  featuresSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuresTitle: {
    fontSize: FontSize.xxs,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000000',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  footerLink: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  footerDot: {
    color: Colors.textTertiary,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
