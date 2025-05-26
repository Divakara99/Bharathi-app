import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeliveryTimeCalculation {
  estimatedTime: number; // in minutes
  distance: number; // in kilometers
  deliveryCharges: number;
  isFreeDelivery: boolean;
  isWithinRadius: boolean;
  baseTime: number;
  additionalTime: number;
}

export interface DeliveryTier {
  maxDistance: number; // in km
  minOrderValue: number; // minimum order value for this tier
  deliveryCharge: number; // delivery charge for this tier
  freeDeliveryAbove: number; // free delivery threshold for this tier
}

export interface CompanyProfile {
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryRadius: number;
  baseDeliveryTime: number;
  timePerKm: number;
  deliveryTiers: DeliveryTier[];
  globalFreeDeliveryAbove: number; // above this amount, delivery is free for all distances
  isDeliveryEnabled: boolean;
}

class DeliveryTimeService {
  
  // Get company profile with delivery settings
  async getCompanyProfile(): Promise<CompanyProfile> {
    try {
      const savedProfile = await AsyncStorage.getItem('companyProfile');
      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
      
      // Default profile with new delivery tiers
      return {
        storeAddress: 'Koramangala, Bangalore, Karnataka 560034',
        storeLatitude: 12.9716,
        storeLongitude: 77.5946,
        deliveryRadius: 15, // Updated to 15km as per requirements
        baseDeliveryTime: 15,
        timePerKm: 5,
        deliveryTiers: [
          // 0-5km tier
          {
            maxDistance: 5,
            minOrderValue: 200,
            deliveryCharge: 30,
            freeDeliveryAbove: 200, // Free delivery for orders ≥200 within 5km
          },
          // 5-10km tier
          {
            maxDistance: 10,
            minOrderValue: 500,
            deliveryCharge: 50,
            freeDeliveryAbove: 500, // Free delivery for orders ≥500 within 10km
          },
          // 10-15km tier
          {
            maxDistance: 15,
            minOrderValue: 0, // No minimum order value
            deliveryCharge: 50,
            freeDeliveryAbove: Infinity, // No free delivery threshold (except global)
          },
        ],
        globalFreeDeliveryAbove: 2000, // Free delivery for all distances above ₹2000
        isDeliveryEnabled: true,
      };
    } catch (error) {
      console.error('Error loading company profile:', error);
      throw error;
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Calculate delivery pricing based on distance and order amount
  private calculateDeliveryPricing(distance: number, orderAmount: number, profile: CompanyProfile): {
    charge: number;
    isFree: boolean;
    tier: DeliveryTier | null;
    reason: string;
  } {
    // Check global free delivery threshold first
    if (orderAmount >= profile.globalFreeDeliveryAbove) {
      return {
        charge: 0,
        isFree: true,
        tier: null,
        reason: `Free delivery for orders above ₹${profile.globalFreeDeliveryAbove}`,
      };
    }

    // Find the appropriate delivery tier based on distance
    const applicableTier = profile.deliveryTiers.find(tier => distance <= tier.maxDistance);
    
    if (!applicableTier) {
      throw new Error(`Delivery not available for ${distance.toFixed(1)}km. Maximum delivery distance is ${profile.deliveryRadius}km.`);
    }

    // Check if order meets minimum value for this tier
    if (orderAmount < applicableTier.minOrderValue) {
      throw new Error(`Minimum order value for ${distance.toFixed(1)}km delivery is ₹${applicableTier.minOrderValue}. Current order: ₹${orderAmount}`);
    }

    // Check if order qualifies for free delivery in this tier
    const isFreeInTier = orderAmount >= applicableTier.freeDeliveryAbove;
    
    return {
      charge: isFreeInTier ? 0 : applicableTier.deliveryCharge,
      isFree: isFreeInTier,
      tier: applicableTier,
      reason: isFreeInTier 
        ? `Free delivery for orders above ₹${applicableTier.freeDeliveryAbove} within ${applicableTier.maxDistance}km`
        : `₹${applicableTier.deliveryCharge} delivery charge for ${distance.toFixed(1)}km`,
    };
  }

  // Get coordinates from address (simplified - in real app use Google Geocoding API)
  async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // This is a simplified mapping for common Bangalore areas
      // In a real app, you'd use Google Geocoding API
      const addressMappings: { [key: string]: { latitude: number; longitude: number } } = {
        'koramangala': { latitude: 12.9716, longitude: 77.5946 },
        'indiranagar': { latitude: 12.9784, longitude: 77.6408 },
        'btm layout': { latitude: 12.9165, longitude: 77.6101 },
        'hsr layout': { latitude: 12.9082, longitude: 77.6476 },
        'whitefield': { latitude: 12.9698, longitude: 77.7500 },
        'electronic city': { latitude: 12.8456, longitude: 77.6603 },
        'marathahalli': { latitude: 12.9591, longitude: 77.6974 },
        'jp nagar': { latitude: 12.9082, longitude: 77.5833 },
        'jayanagar': { latitude: 12.9279, longitude: 77.5937 },
        'rajajinagar': { latitude: 12.9915, longitude: 77.5552 },
      };

      const normalizedAddress = address.toLowerCase();
      
      for (const [area, coords] of Object.entries(addressMappings)) {
        if (normalizedAddress.includes(area)) {
          return coords;
        }
      }

      // If no match found, return approximate coordinates based on "bangalore"
      if (normalizedAddress.includes('bangalore') || normalizedAddress.includes('bengaluru')) {
        // Return random coordinates within Bangalore bounds
        return {
          latitude: 12.9716 + (Math.random() - 0.5) * 0.2, // ±0.1 degree variation
          longitude: 77.5946 + (Math.random() - 0.5) * 0.2,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      return null;
    }
  }

  // Calculate estimated delivery time and charges
  async calculateDeliveryTime(
    customerAddress: string, 
    orderAmount: number = 0
  ): Promise<DeliveryTimeCalculation> {
    try {
      const profile = await this.getCompanyProfile();
      
      if (!profile.isDeliveryEnabled) {
        throw new Error('Delivery service is currently disabled');
      }

      // Get customer coordinates
      const customerCoords = await this.getCoordinatesFromAddress(customerAddress);
      
      if (!customerCoords) {
        throw new Error('Unable to determine delivery location. Please provide a valid address.');
      }

      // Calculate distance from store
      const distance = this.calculateDistance(
        profile.storeLatitude,
        profile.storeLongitude,
        customerCoords.latitude,
        customerCoords.longitude
      );

      // Check if within delivery radius
      const isWithinRadius = distance <= profile.deliveryRadius;
      
      if (!isWithinRadius) {
        throw new Error(`Delivery not available. Location is ${distance.toFixed(1)}km away. We deliver within ${profile.deliveryRadius}km radius.`);
      }

      // Calculate delivery time
      const baseTime = profile.baseDeliveryTime;
      const additionalTime = Math.round(distance * profile.timePerKm);
      const estimatedTime = baseTime + additionalTime;

      // Calculate delivery charges based on distance tiers
      const deliveryPricing = this.calculateDeliveryPricing(distance, orderAmount, profile);
      const deliveryCharges = deliveryPricing.charge;
      const isFreeDelivery = deliveryPricing.isFree;

      return {
        estimatedTime,
        distance,
        deliveryCharges,
        isFreeDelivery,
        isWithinRadius,
        baseTime,
        additionalTime,
      };
    } catch (error) {
      console.error('Error calculating delivery time:', error);
      throw error;
    }
  }

  // Get delivery time for multiple addresses (for testing)
  async calculateMultipleDeliveryTimes(addresses: string[]): Promise<{
    address: string;
    result: DeliveryTimeCalculation | null;
    error?: string;
  }[]> {
    const results = [];
    
    for (const address of addresses) {
      try {
        const result = await this.calculateDeliveryTime(address);
        results.push({ address, result });
      } catch (error) {
        results.push({ 
          address, 
          result: null, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // Format delivery time for display
  formatDeliveryTime(calculation: DeliveryTimeCalculation): string {
    const { estimatedTime, distance } = calculation;
    
    if (estimatedTime <= 30) {
      return `${estimatedTime} mins (${distance.toFixed(1)}km)`;
    } else if (estimatedTime <= 60) {
      return `${estimatedTime} mins (${distance.toFixed(1)}km)`;
    } else {
      const hours = Math.floor(estimatedTime / 60);
      const minutes = estimatedTime % 60;
      return `${hours}h ${minutes}m (${distance.toFixed(1)}km)`;
    }
  }

  // Get delivery summary text
  getDeliverySummary(calculation: DeliveryTimeCalculation, orderAmount: number): string {
    const timeText = this.formatDeliveryTime(calculation);
    const chargeText = calculation.isFreeDelivery 
      ? 'Free delivery' 
      : `₹${calculation.deliveryCharges} delivery charges`;
    
    return `Estimated delivery: ${timeText} • ${chargeText}`;
  }

  // Check if delivery is available for an address
  async isDeliveryAvailable(customerAddress: string): Promise<{
    available: boolean;
    reason?: string;
    distance?: number;
    maxRadius?: number;
  }> {
    try {
      const profile = await this.getCompanyProfile();
      
      if (!profile.isDeliveryEnabled) {
        return {
          available: false,
          reason: 'Delivery service is currently disabled',
        };
      }

      const customerCoords = await this.getCoordinatesFromAddress(customerAddress);
      
      if (!customerCoords) {
        return {
          available: false,
          reason: 'Unable to determine delivery location',
        };
      }

      const distance = this.calculateDistance(
        profile.storeLatitude,
        profile.storeLongitude,
        customerCoords.latitude,
        customerCoords.longitude
      );

      const isWithinRadius = distance <= profile.deliveryRadius;
      
      return {
        available: isWithinRadius,
        reason: isWithinRadius 
          ? undefined 
          : `Location is ${distance.toFixed(1)}km away. We deliver within ${profile.deliveryRadius}km radius.`,
        distance,
        maxRadius: profile.deliveryRadius,
      };
    } catch (error) {
      return {
        available: false,
        reason: 'Error checking delivery availability',
      };
    }
  }

  // Get delivery zones (for admin analytics)
  async getDeliveryZones(): Promise<{
    totalRadius: number;
    zones: {
      name: string;
      distance: string;
      estimatedTime: string;
      areas: string[];
    }[];
  }> {
    try {
      const profile = await this.getCompanyProfile();
      
      const zones = profile.deliveryTiers.map((tier, index) => {
        const prevDistance = index === 0 ? 0 : profile.deliveryTiers[index - 1].maxDistance;
        const minTime = profile.baseDeliveryTime + prevDistance * profile.timePerKm;
        const maxTime = profile.baseDeliveryTime + tier.maxDistance * profile.timePerKm;
        
        let zoneName = '';
        let areas: string[] = [];
        
        if (tier.maxDistance <= 5) {
          zoneName = 'Zone 1 (Express)';
          areas = ['Koramangala', 'BTM Layout', 'JP Nagar', 'Jayanagar'];
        } else if (tier.maxDistance <= 10) {
          zoneName = 'Zone 2 (Standard)';
          areas = ['Indiranagar', 'HSR Layout', 'Banashankari', 'Basavanagudi'];
        } else {
          zoneName = 'Zone 3 (Extended)';
          areas = ['Whitefield', 'Electronic City', 'Marathahalli', 'Rajajinagar'];
        }

        const freeDeliveryText = tier.freeDeliveryAbove === Infinity 
          ? `₹${profile.globalFreeDeliveryAbove}+` 
          : `₹${tier.freeDeliveryAbove}+`;

        return {
          name: zoneName,
          distance: `${prevDistance}-${tier.maxDistance} km`,
          estimatedTime: `${Math.round(minTime)}-${Math.round(maxTime)} mins`,
          areas,
          pricing: {
            minOrder: tier.minOrderValue > 0 ? `₹${tier.minOrderValue}` : 'No minimum',
            deliveryCharge: `₹${tier.deliveryCharge}`,
            freeDelivery: freeDeliveryText,
          },
        };
      });

      return {
        totalRadius: profile.deliveryRadius,
        zones,
      };
    } catch (error) {
      console.error('Error getting delivery zones:', error);
      return {
        totalRadius: 5,
        zones: [],
      };
    }
  }
}

export const deliveryTimeService = new DeliveryTimeService(); 