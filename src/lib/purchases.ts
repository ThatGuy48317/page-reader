import { Platform } from 'react-native';

export const ENTITLEMENT_ID = 'pro_access';

export interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: any;
}

export interface PurchasesOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: PurchasesPackage[];
  monthly?: PurchasesPackage;
  annual?: PurchasesPackage;
}

export interface CustomerInfo {
  entitlements: {
    active: {
      [key: string]: any;
    };
  };
}

export async function configurePurchases(userId?: string): Promise<void> {
  // Disabled RevenueCat for now
  return Promise.resolve();
}

export async function checkProEntitlement(): Promise<boolean> {
  // Return true to allow Pro features locally for personal use without payment
  return Promise.resolve(true);
}

export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  return Promise.resolve(null);
}

export async function purchaseSubscriptionPackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
  return Promise.resolve({ success: true });
}

export async function restoreUserPurchases(): Promise<{ success: boolean; isPro: boolean }> {
  return Promise.resolve({ success: true, isPro: true });
}
