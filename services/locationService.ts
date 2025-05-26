import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store location (Bharathi Enterprises main store)
export const STORE_LOCATION = {
  latitude: 12.9716, // Bangalore coordinates (example)
  longitude: 77.5946,
  address: 'Bharathi Enterprises, Koramangala, Bangalore',
};

// Maximum distance from store to receive orders (in kilometers)
export const MAX_DELIVERY_RADIUS = 5; // 5km radius

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface DeliveryPartnerLocation {
  partnerId: string;
  partnerName: string;
  location: LocationData;
  isOnline: boolean;
  distanceFromStore: number;
  isEligibleForOrders: boolean;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private currentLocation: LocationData | null = null;
  private isTracking = false;

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      return backgroundStatus.status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
        accuracy: location.coords.accuracy,
      };

      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Start location tracking
  async startTracking(partnerId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      if (this.isTracking) {
        await this.stopTracking();
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 50, // Update when moved 50 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            accuracy: location.coords.accuracy,
          };

          this.currentLocation = locationData;
          this.updatePartnerLocation(partnerId, locationData);
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  async stopTracking(): Promise<void> {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
  }

  // Update partner location in storage
  private async updatePartnerLocation(partnerId: string, location: LocationData): Promise<void> {
    try {
      const distanceFromStore = this.calculateDistance(
        location.latitude,
        location.longitude,
        STORE_LOCATION.latitude,
        STORE_LOCATION.longitude
      );

      const partnerLocation: DeliveryPartnerLocation = {
        partnerId,
        partnerName: await this.getPartnerName(partnerId),
        location,
        isOnline: true,
        distanceFromStore,
        isEligibleForOrders: distanceFromStore <= MAX_DELIVERY_RADIUS,
      };

      // Store in AsyncStorage
      const existingLocations = await AsyncStorage.getItem('deliveryPartnerLocations');
      const locations = existingLocations ? JSON.parse(existingLocations) : [];
      
      const existingIndex = locations.findIndex((loc: DeliveryPartnerLocation) => loc.partnerId === partnerId);
      if (existingIndex >= 0) {
        locations[existingIndex] = partnerLocation;
      } else {
        locations.push(partnerLocation);
      }

      await AsyncStorage.setItem('deliveryPartnerLocations', JSON.stringify(locations));
    } catch (error) {
      console.error('Error updating partner location:', error);
    }
  }

  // Get partner name from storage
  private async getPartnerName(partnerId: string): Promise<string> {
    try {
      const userName = await AsyncStorage.getItem('userName');
      return userName || 'Delivery Partner';
    } catch (error) {
      return 'Delivery Partner';
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
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

  // Check if partner is eligible for orders
  async isEligibleForOrders(partnerId: string): Promise<boolean> {
    try {
      const existingLocations = await AsyncStorage.getItem('deliveryPartnerLocations');
      const locations = existingLocations ? JSON.parse(existingLocations) : [];
      
      const partnerLocation = locations.find((loc: DeliveryPartnerLocation) => loc.partnerId === partnerId);
      return partnerLocation ? partnerLocation.isEligibleForOrders : false;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return false;
    }
  }

  // Get all eligible delivery partners
  async getEligiblePartners(): Promise<DeliveryPartnerLocation[]> {
    try {
      const existingLocations = await AsyncStorage.getItem('deliveryPartnerLocations');
      const locations = existingLocations ? JSON.parse(existingLocations) : [];
      
      return locations.filter((loc: DeliveryPartnerLocation) => 
        loc.isOnline && loc.isEligibleForOrders
      );
    } catch (error) {
      console.error('Error getting eligible partners:', error);
      return [];
    }
  }

  // Set partner offline
  async setPartnerOffline(partnerId: string): Promise<void> {
    try {
      const existingLocations = await AsyncStorage.getItem('deliveryPartnerLocations');
      const locations = existingLocations ? JSON.parse(existingLocations) : [];
      
      const updatedLocations = locations.map((loc: DeliveryPartnerLocation) => {
        if (loc.partnerId === partnerId) {
          return { ...loc, isOnline: false, isEligibleForOrders: false };
        }
        return loc;
      });

      await AsyncStorage.setItem('deliveryPartnerLocations', JSON.stringify(updatedLocations));
      await this.stopTracking();
    } catch (error) {
      console.error('Error setting partner offline:', error);
    }
  }

  // Get current location data
  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService(); 