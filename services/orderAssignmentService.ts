import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, DeliveryPartnerLocation, MAX_DELIVERY_RADIUS } from './locationService';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: number;
  amount: number;
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'rejected';
  distance: string;
  estimatedTime: number;
  estimatedEarning: number;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  createdAt: string;
  assignedAt?: string;
}

export interface OrderAssignmentResult {
  success: boolean;
  message: string;
  assignedPartner?: DeliveryPartnerLocation;
  order?: Order;
}

class OrderAssignmentService {
  
  // Get all eligible delivery partners for order assignment
  async getEligiblePartnersForOrder(): Promise<DeliveryPartnerLocation[]> {
    try {
      const eligiblePartners = await locationService.getEligiblePartners();
      
      // Filter partners who are online, eligible, and not currently busy
      const availablePartners = eligiblePartners.filter(partner => 
        partner.isOnline && 
        partner.isEligibleForOrders && 
        partner.distanceFromStore <= MAX_DELIVERY_RADIUS
      );

      // Sort by distance from store (closest first)
      return availablePartners.sort((a, b) => a.distanceFromStore - b.distanceFromStore);
    } catch (error) {
      console.error('Error getting eligible partners:', error);
      return [];
    }
  }

  // Assign order to the nearest eligible delivery partner
  async assignOrderToNearestPartner(order: Order): Promise<OrderAssignmentResult> {
    try {
      const eligiblePartners = await this.getEligiblePartnersForOrder();
      
      if (eligiblePartners.length === 0) {
        return {
          success: false,
          message: 'No delivery partners available near the store. Orders can only be assigned to partners within 5km radius.',
        };
      }

      // Get the nearest available partner
      const nearestPartner = eligiblePartners[0];
      
      // Check if partner is already assigned to another order
      const isPartnerBusy = await this.isPartnerBusy(nearestPartner.partnerId);
      if (isPartnerBusy) {
        // Try next available partner
        const availablePartner = eligiblePartners.find(partner => 
          !this.isPartnerBusy(partner.partnerId)
        );
        
        if (!availablePartner) {
          return {
            success: false,
            message: 'All nearby delivery partners are currently busy. Please try again later.',
          };
        }
        
        return await this.assignOrderToPartner(order, availablePartner);
      }

      return await this.assignOrderToPartner(order, nearestPartner);
    } catch (error) {
      console.error('Error assigning order:', error);
      return {
        success: false,
        message: 'Failed to assign order. Please try again.',
      };
    }
  }

  // Assign order to specific partner
  private async assignOrderToPartner(order: Order, partner: DeliveryPartnerLocation): Promise<OrderAssignmentResult> {
    try {
      const updatedOrder: Order = {
        ...order,
        status: 'assigned',
        assignedPartnerId: partner.partnerId,
        assignedPartnerName: partner.partnerName,
        assignedAt: new Date().toISOString(),
      };

      // Save updated order
      await this.saveOrder(updatedOrder);
      
      // Mark partner as busy
      await this.markPartnerAsBusy(partner.partnerId, order.id);

      return {
        success: true,
        message: `Order assigned to ${partner.partnerName} (${partner.distanceFromStore.toFixed(1)}km from store)`,
        assignedPartner: partner,
        order: updatedOrder,
      };
    } catch (error) {
      console.error('Error assigning order to partner:', error);
      return {
        success: false,
        message: 'Failed to assign order to partner.',
      };
    }
  }

  // Check if partner is currently busy with another order
  private async isPartnerBusy(partnerId: string): Promise<boolean> {
    try {
      const orders = await this.getAllOrders();
      return orders.some(order => 
        order.assignedPartnerId === partnerId && 
        ['assigned', 'accepted', 'picked_up', 'on_the_way'].includes(order.status)
      );
    } catch (error) {
      console.error('Error checking partner status:', error);
      return false;
    }
  }

  // Mark partner as busy with an order
  private async markPartnerAsBusy(partnerId: string, orderId: string): Promise<void> {
    try {
      const partnerStatus = await AsyncStorage.getItem('partnerStatus');
      const statusData = partnerStatus ? JSON.parse(partnerStatus) : {};
      
      statusData[partnerId] = {
        status: 'busy',
        activeOrderId: orderId,
        assignedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('partnerStatus', JSON.stringify(statusData));
    } catch (error) {
      console.error('Error marking partner as busy:', error);
    }
  }

  // Mark partner as available
  async markPartnerAsAvailable(partnerId: string): Promise<void> {
    try {
      const partnerStatus = await AsyncStorage.getItem('partnerStatus');
      const statusData = partnerStatus ? JSON.parse(partnerStatus) : {};
      
      if (statusData[partnerId]) {
        statusData[partnerId] = {
          status: 'available',
          activeOrderId: null,
          updatedAt: new Date().toISOString(),
        };
      }

      await AsyncStorage.setItem('partnerStatus', JSON.stringify(statusData));
    } catch (error) {
      console.error('Error marking partner as available:', error);
    }
  }

  // Save order to storage
  private async saveOrder(order: Order): Promise<void> {
    try {
      const existingOrders = await AsyncStorage.getItem('orders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      
      const existingIndex = orders.findIndex((o: Order) => o.id === order.id);
      if (existingIndex >= 0) {
        orders[existingIndex] = order;
      } else {
        orders.push(order);
      }

      await AsyncStorage.setItem('orders', JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  // Get all orders
  private async getAllOrders(): Promise<Order[]> {
    try {
      const orders = await AsyncStorage.getItem('orders');
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  // Get orders assigned to a specific partner
  async getOrdersForPartner(partnerId: string): Promise<Order[]> {
    try {
      const orders = await this.getAllOrders();
      return orders.filter(order => 
        order.assignedPartnerId === partnerId && 
        ['assigned', 'accepted', 'picked_up', 'on_the_way'].includes(order.status)
      );
    } catch (error) {
      console.error('Error getting partner orders:', error);
      return [];
    }
  }

  // Get available orders (not yet assigned)
  async getAvailableOrders(): Promise<Order[]> {
    try {
      const orders = await this.getAllOrders();
      return orders.filter(order => order.status === 'pending');
    } catch (error) {
      console.error('Error getting available orders:', error);
      return [];
    }
  }

  // Auto-assign pending orders to eligible partners
  async autoAssignPendingOrders(): Promise<void> {
    try {
      const pendingOrders = await this.getAvailableOrders();
      const eligiblePartners = await this.getEligiblePartnersForOrder();

      if (pendingOrders.length === 0 || eligiblePartners.length === 0) {
        return;
      }

      for (const order of pendingOrders) {
        const result = await this.assignOrderToNearestPartner(order);
        if (result.success) {
          console.log(`Auto-assigned order ${order.id} to ${result.assignedPartner?.partnerName}`);
        }
      }
    } catch (error) {
      console.error('Error auto-assigning orders:', error);
    }
  }

  // Get assignment statistics
  async getAssignmentStats(): Promise<{
    totalOrders: number;
    assignedOrders: number;
    pendingOrders: number;
    eligiblePartners: number;
    averageDistance: number;
  }> {
    try {
      const orders = await this.getAllOrders();
      const eligiblePartners = await this.getEligiblePartnersForOrder();
      
      const assignedOrders = orders.filter(order => order.status !== 'pending');
      const pendingOrders = orders.filter(order => order.status === 'pending');
      
      const averageDistance = eligiblePartners.length > 0 
        ? eligiblePartners.reduce((sum, partner) => sum + partner.distanceFromStore, 0) / eligiblePartners.length
        : 0;

      return {
        totalOrders: orders.length,
        assignedOrders: assignedOrders.length,
        pendingOrders: pendingOrders.length,
        eligiblePartners: eligiblePartners.length,
        averageDistance: Math.round(averageDistance * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return {
        totalOrders: 0,
        assignedOrders: 0,
        pendingOrders: 0,
        eligiblePartners: 0,
        averageDistance: 0,
      };
    }
  }
}

export const orderAssignmentService = new OrderAssignmentService(); 