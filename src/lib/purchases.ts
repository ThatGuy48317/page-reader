import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_placeholder_key',
  google: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_placeholder_key',
};

export const ENTITLEMENT_ID = 'pro_access';

export async function configurePurchases(userId?: string): Promise<void> {
  if (Platform.OS === 'web') {
    return; // RevenueCat Native SDK is not applicable for web
  }

  try {
    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    if (!apiKey || apiKey.includes('placeholder')) {
      console.warn('RevenueCat API key missing or placeholder. Running in Sandbox Mock Mode.');
      return;
    }

    Purchases.configure({ apiKey, appUserID: userId });
  } catch (error) {
    console.error('Failed to configure RevenueCat Purchases SDK:', error);
  }
}

export async function checkProEntitlement(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
  } catch (error) {
    console.warn('Error checking pro entitlement:', error);
    return false;
  }
}

export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (Platform.OS === 'web') return null;

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
  } catch (error) {
    console.warn('Error fetching RevenueCat offerings:', error);
  }
  return null;
}

export async function purchaseSubscriptionPackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
    return { success: isPro, customerInfo };
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase subscription failed:', error);
    }
    return { success: false };
  }
}

export async function restoreUserPurchases(): Promise<{ success: boolean; isPro: boolean }> {
  if (Platform.OS === 'web') return { success: false, isPro: false };

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
    return { success: true, isPro };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, isPro: false };
  }
}
