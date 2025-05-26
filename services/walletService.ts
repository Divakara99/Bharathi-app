import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  source: 'admin_free_cash' | 'admin_add_balance' | 'order_payment' | 'refund';
  description: string;
  timestamp: string;
  expiryDate?: string; // Only for free cash
  adminId?: string; // Who added the free cash
  orderId?: string; // If related to an order
}

export interface CustomerWallet {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalBalance: number;
  freeCashBalance: number;
  addedBalance: number;
  transactions: WalletTransaction[];
  lastUpdated: string;
}

export interface WalletSettings {
  defaultFreeCashExpiry: number; // days
  maxFreeCashAmount: number;
  maxWalletBalance: number;
  isWalletEnabled: boolean;
}

class WalletService {
  
  // Get wallet settings
  async getWalletSettings(): Promise<WalletSettings> {
    try {
      const settings = await AsyncStorage.getItem('walletSettings');
      if (settings) {
        return JSON.parse(settings);
      }
      
      // Default settings
      return {
        defaultFreeCashExpiry: 30, // 30 days
        maxFreeCashAmount: 500,
        maxWalletBalance: 10000,
        isWalletEnabled: true,
      };
    } catch (error) {
      console.error('Error loading wallet settings:', error);
      throw error;
    }
  }

  // Save wallet settings (admin only)
  async saveWalletSettings(settings: WalletSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('walletSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving wallet settings:', error);
      throw error;
    }
  }

  // Get customer wallet
  async getCustomerWallet(customerId: string): Promise<CustomerWallet | null> {
    try {
      const wallet = await AsyncStorage.getItem(`wallet_${customerId}`);
      if (wallet) {
        const walletData = JSON.parse(wallet);
        // Clean expired free cash
        await this.cleanExpiredFreeCash(walletData);
        return walletData;
      }
      return null;
    } catch (error) {
      console.error('Error loading customer wallet:', error);
      throw error;
    }
  }

  // Create new customer wallet
  async createCustomerWallet(customerId: string, customerName: string, customerEmail: string): Promise<CustomerWallet> {
    try {
      const wallet: CustomerWallet = {
        customerId,
        customerName,
        customerEmail,
        totalBalance: 0,
        freeCashBalance: 0,
        addedBalance: 0,
        transactions: [],
        lastUpdated: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(`wallet_${customerId}`, JSON.stringify(wallet));
      return wallet;
    } catch (error) {
      console.error('Error creating customer wallet:', error);
      throw error;
    }
  }

  // Add free cash (admin only)
  async addFreeCash(
    customerId: string,
    amount: number,
    adminId: string,
    expiryDays: number,
    description: string = 'Free cash added by admin'
  ): Promise<CustomerWallet> {
    try {
      const settings = await this.getWalletSettings();
      
      if (!settings.isWalletEnabled) {
        throw new Error('Wallet service is currently disabled');
      }

      if (amount > settings.maxFreeCashAmount) {
        throw new Error(`Maximum free cash amount is ₹${settings.maxFreeCashAmount}`);
      }

      let wallet = await this.getCustomerWallet(customerId);
      if (!wallet) {
        throw new Error('Customer wallet not found');
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const transaction: WalletTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit',
        amount,
        source: 'admin_free_cash',
        description,
        timestamp: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        adminId,
      };

      wallet.freeCashBalance += amount;
      wallet.totalBalance += amount;
      wallet.transactions.unshift(transaction);
      wallet.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(`wallet_${customerId}`, JSON.stringify(wallet));
      return wallet;
    } catch (error) {
      console.error('Error adding free cash:', error);
      throw error;
    }
  }

  // Add balance (admin only)
  async addBalance(
    customerId: string,
    amount: number,
    adminId: string,
    description: string = 'Balance added by admin'
  ): Promise<CustomerWallet> {
    try {
      const settings = await this.getWalletSettings();
      
      if (!settings.isWalletEnabled) {
        throw new Error('Wallet service is currently disabled');
      }

      let wallet = await this.getCustomerWallet(customerId);
      if (!wallet) {
        throw new Error('Customer wallet not found');
      }

      if (wallet.totalBalance + amount > settings.maxWalletBalance) {
        throw new Error(`Maximum wallet balance is ₹${settings.maxWalletBalance}`);
      }

      const transaction: WalletTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit',
        amount,
        source: 'admin_add_balance',
        description,
        timestamp: new Date().toISOString(),
        adminId,
      };

      wallet.addedBalance += amount;
      wallet.totalBalance += amount;
      wallet.transactions.unshift(transaction);
      wallet.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(`wallet_${customerId}`, JSON.stringify(wallet));
      return wallet;
    } catch (error) {
      console.error('Error adding balance:', error);
      throw error;
    }
  }

  // Deduct from wallet for order payment
  async deductForOrder(
    customerId: string,
    amount: number,
    orderId: string,
    description: string = 'Order payment'
  ): Promise<{ success: boolean; wallet: CustomerWallet; deductedAmount: number }> {
    try {
      let wallet = await this.getCustomerWallet(customerId);
      if (!wallet) {
        throw new Error('Customer wallet not found');
      }

      if (wallet.totalBalance < amount) {
        return {
          success: false,
          wallet,
          deductedAmount: 0,
        };
      }

      // Deduct from free cash first (FIFO - oldest first)
      let remainingAmount = amount;
      let deductedFreeCash = 0;
      let deductedAddedBalance = 0;

      // Sort free cash transactions by expiry date (oldest first)
      const freeCashTransactions = wallet.transactions
        .filter(t => t.source === 'admin_free_cash' && t.expiryDate)
        .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

      // Calculate available free cash
      const availableFreeCash = Math.min(wallet.freeCashBalance, remainingAmount);
      if (availableFreeCash > 0) {
        deductedFreeCash = availableFreeCash;
        remainingAmount -= availableFreeCash;
        wallet.freeCashBalance -= availableFreeCash;
      }

      // Deduct remaining from added balance
      if (remainingAmount > 0) {
        deductedAddedBalance = Math.min(wallet.addedBalance, remainingAmount);
        wallet.addedBalance -= deductedAddedBalance;
        remainingAmount -= deductedAddedBalance;
      }

      const totalDeducted = deductedFreeCash + deductedAddedBalance;

      const transaction: WalletTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'debit',
        amount: totalDeducted,
        source: 'order_payment',
        description: `${description} (Free: ₹${deductedFreeCash}, Added: ₹${deductedAddedBalance})`,
        timestamp: new Date().toISOString(),
        orderId,
      };

      wallet.totalBalance -= totalDeducted;
      wallet.transactions.unshift(transaction);
      wallet.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(`wallet_${customerId}`, JSON.stringify(wallet));

      return {
        success: true,
        wallet,
        deductedAmount: totalDeducted,
      };
    } catch (error) {
      console.error('Error deducting from wallet:', error);
      throw error;
    }
  }

  // Clean expired free cash
  async cleanExpiredFreeCash(wallet: CustomerWallet): Promise<void> {
    try {
      const now = new Date();
      let expiredAmount = 0;

      // Find expired free cash transactions
      const expiredTransactions = wallet.transactions.filter(t => 
        t.source === 'admin_free_cash' && 
        t.expiryDate && 
        new Date(t.expiryDate) < now
      );

      for (const transaction of expiredTransactions) {
        expiredAmount += transaction.amount;
      }

      if (expiredAmount > 0) {
        // Add expiry transaction
        const expiryTransaction: WalletTransaction = {
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'debit',
          amount: expiredAmount,
          source: 'admin_free_cash',
          description: `Free cash expired (₹${expiredAmount})`,
          timestamp: new Date().toISOString(),
        };

        wallet.freeCashBalance = Math.max(0, wallet.freeCashBalance - expiredAmount);
        wallet.totalBalance = Math.max(0, wallet.totalBalance - expiredAmount);
        wallet.transactions.unshift(expiryTransaction);
        wallet.lastUpdated = new Date().toISOString();

        await AsyncStorage.setItem(`wallet_${wallet.customerId}`, JSON.stringify(wallet));
      }
    } catch (error) {
      console.error('Error cleaning expired free cash:', error);
    }
  }

  // Get all customer wallets (admin only)
  async getAllCustomerWallets(): Promise<CustomerWallet[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const walletKeys = keys.filter(key => key.startsWith('wallet_'));
      
      const wallets: CustomerWallet[] = [];
      
      for (const key of walletKeys) {
        const walletData = await AsyncStorage.getItem(key);
        if (walletData) {
          const wallet = JSON.parse(walletData);
          await this.cleanExpiredFreeCash(wallet);
          wallets.push(wallet);
        }
      }
      
      return wallets.sort((a, b) => b.totalBalance - a.totalBalance);
    } catch (error) {
      console.error('Error loading all customer wallets:', error);
      throw error;
    }
  }

  // Get wallet statistics (admin only)
  async getWalletStatistics(): Promise<{
    totalCustomers: number;
    totalWalletBalance: number;
    totalFreeCash: number;
    totalAddedBalance: number;
    activeWallets: number;
  }> {
    try {
      const wallets = await this.getAllCustomerWallets();
      
      return {
        totalCustomers: wallets.length,
        totalWalletBalance: wallets.reduce((sum, w) => sum + w.totalBalance, 0),
        totalFreeCash: wallets.reduce((sum, w) => sum + w.freeCashBalance, 0),
        totalAddedBalance: wallets.reduce((sum, w) => sum + w.addedBalance, 0),
        activeWallets: wallets.filter(w => w.totalBalance > 0).length,
      };
    } catch (error) {
      console.error('Error getting wallet statistics:', error);
      throw error;
    }
  }

  // Get wallet transaction analytics (admin only)
  async getWalletAnalytics(): Promise<{
    totalTransactions: number;
    totalFreeCashAdded: number;
    totalBalanceAdded: number;
    totalOrderPayments: number;
    averageWalletBalance: number;
    expiringFreeCashAmount: number;
    topCustomersByBalance: { customerId: string; customerName: string; balance: number }[];
  }> {
    try {
      const wallets = await this.getAllCustomerWallets();
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      let totalTransactions = 0;
      let totalFreeCashAdded = 0;
      let totalBalanceAdded = 0;
      let totalOrderPayments = 0;
      let expiringFreeCashAmount = 0;
      
      wallets.forEach(wallet => {
        totalTransactions += wallet.transactions.length;
        
        wallet.transactions.forEach(transaction => {
          if (transaction.source === 'admin_free_cash') {
            totalFreeCashAdded += transaction.amount;
            
            // Check if free cash is expiring soon
            if (transaction.expiryDate && new Date(transaction.expiryDate) <= sevenDaysFromNow) {
              expiringFreeCashAmount += transaction.amount;
            }
          } else if (transaction.source === 'admin_add_balance') {
            totalBalanceAdded += transaction.amount;
          } else if (transaction.source === 'order_payment') {
            totalOrderPayments += transaction.amount;
          }
        });
      });
      
      const averageWalletBalance = wallets.length > 0 
        ? wallets.reduce((sum, wallet) => sum + wallet.totalBalance, 0) / wallets.length 
        : 0;
      
      const topCustomersByBalance = wallets
        .sort((a, b) => b.totalBalance - a.totalBalance)
        .slice(0, 5)
        .map(wallet => ({
          customerId: wallet.customerId,
          customerName: wallet.customerName,
          balance: wallet.totalBalance
        }));
      
      return {
        totalTransactions,
        totalFreeCashAdded,
        totalBalanceAdded,
        totalOrderPayments,
        averageWalletBalance,
        expiringFreeCashAmount,
        topCustomersByBalance,
      };
    } catch (error) {
      console.error('Error getting wallet analytics:', error);
      throw error;
    }
  }

  // Format transaction for display
  formatTransaction(transaction: WalletTransaction): string {
    const date = new Date(transaction.timestamp).toLocaleDateString();
    const time = new Date(transaction.timestamp).toLocaleTimeString();
    const sign = transaction.type === 'credit' ? '+' : '-';
    
    let details = `${sign}₹${transaction.amount} - ${transaction.description}`;
    
    if (transaction.expiryDate) {
      const expiryDate = new Date(transaction.expiryDate).toLocaleDateString();
      details += ` (Expires: ${expiryDate})`;
    }
    
    return `${date} ${time}\n${details}`;
  }
}

export const walletService = new WalletService(); 