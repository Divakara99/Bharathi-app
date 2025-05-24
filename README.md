# QuickMart - Quick Commerce App

A comprehensive quick commerce application built with React Native and Expo, similar to Zepto, featuring three distinct user interfaces for customers, admins, and delivery partners.

## 🚀 Features

### Customer App
- **Role-based Landing**: Choose between Customer, Admin, or Delivery Partner
- **Product Browsing**: Browse categories, featured products, and search functionality
- **Shopping Cart**: Add/remove items, quantity management, and checkout
- **10-Minute Delivery**: Fast delivery promise with real-time tracking
- **User Authentication**: Secure login/register with demo credentials
- **Order Management**: View order history and track current orders

### Admin Dashboard
- **Store Management**: Comprehensive dashboard with key metrics
- **Order Management**: View and manage incoming orders
- **Product Management**: Add, edit, and manage inventory
- **Analytics**: Sales performance and customer insights
- **Real-time Updates**: Live order status and notifications

### Delivery Partner App
- **Earnings Dashboard**: Track daily earnings and performance
- **Order Assignment**: Accept/reject delivery requests
- **Route Optimization**: Integrated maps for efficient delivery
- **Online/Offline Toggle**: Control availability status
- **Performance Metrics**: Delivery stats and ratings

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (File-based routing)
- **UI Components**: Custom components with React Native
- **Icons**: Expo Vector Icons
- **Gradients**: Expo Linear Gradient
- **Storage**: AsyncStorage for local data persistence
- **Maps**: React Native Maps (for delivery tracking)
- **Notifications**: Expo Notifications
- **Location**: Expo Location

## 📱 App Structure

```
app/
├── index.tsx                 # Landing screen with role selection
├── _layout.tsx              # Root layout with navigation
├── (auth)/                  # Authentication screens
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (customer)/              # Customer interface
│   ├── _layout.tsx          # Tab navigation
│   ├── index.tsx            # Home screen
│   ├── search.tsx           # Product search
│   ├── cart.tsx             # Shopping cart
│   ├── orders.tsx           # Order history
│   └── profile.tsx          # User profile
├── (admin)/                 # Admin interface
│   ├── _layout.tsx          # Tab navigation
│   ├── index.tsx            # Dashboard
│   ├── products.tsx         # Product management
│   ├── orders.tsx           # Order management
│   ├── analytics.tsx        # Analytics
│   └── settings.tsx         # Settings
└── (delivery)/              # Delivery partner interface
    ├── _layout.tsx          # Tab navigation
    ├── index.tsx            # Dashboard
    ├── orders.tsx           # Available orders
    ├── map.tsx              # Delivery map
    ├── earnings.tsx         # Earnings tracking
    └── profile.tsx          # Profile settings
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ap30
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## 🔐 Demo Credentials

### Customer Login
- **Email**: customer@quickmart.com
- **Password**: customer123

### Admin Login
- **Email**: admin@quickmart.com
- **Password**: admin123

### Delivery Partner Login
- **Email**: delivery@quickmart.com
- **Password**: delivery123

## 📋 Key Features Implemented

### 🛒 Customer Features
- ✅ Product catalog with categories
- ✅ Search and filter functionality
- ✅ Shopping cart with quantity management
- ✅ Checkout process
- ✅ Order tracking
- ✅ User profile management
- ✅ 10-minute delivery promise
- ✅ Real-time notifications

### 👨‍💼 Admin Features
- ✅ Sales dashboard with metrics
- ✅ Order management system
- ✅ Product inventory management
- ✅ Customer analytics
- ✅ Performance tracking
- ✅ Store settings
- ✅ Real-time order updates

### 🏍️ Delivery Features
- ✅ Earnings dashboard
- ✅ Order acceptance/rejection
- ✅ Route optimization
- ✅ Online/offline status
- ✅ Performance metrics
- ✅ Delivery tracking
- ✅ Customer communication

## 🎨 Design System

### Color Palette
- **Primary Green**: #10b981 (Customer theme)
- **Primary Red**: #ef4444 (Admin theme)
- **Primary Orange**: #f59e0b (Delivery theme)
- **Background**: #f8f9fa
- **Text Primary**: #333333
- **Text Secondary**: #666666

### Typography
- **Headers**: Bold, 18-24px
- **Body**: Regular, 14-16px
- **Captions**: Regular, 12px

## 📱 Screenshots

### Customer App
- Landing screen with role selection
- Product catalog with categories
- Shopping cart and checkout
- Order tracking interface

### Admin Dashboard
- Sales metrics and analytics
- Order management interface
- Product inventory management
- Performance dashboard

### Delivery Partner App
- Earnings and performance dashboard
- Available orders interface
- Map integration for deliveries
- Online/offline status toggle

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
API_BASE_URL=your_api_url
MAPS_API_KEY=your_maps_api_key
NOTIFICATION_KEY=your_notification_key
```

### App Configuration
Update `app.json` for:
- App name and version
- Icon and splash screen
- Permissions (location, notifications)
- Build configurations

## 🚀 Deployment

### Building for Production

1. **Build for iOS**
   ```bash
   npx expo build:ios
   ```

2. **Build for Android**
   ```bash
   npx expo build:android
   ```

3. **Using EAS Build (Recommended)**
   ```bash
   npm install -g @expo/eas-cli
   eas build --platform all
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Zepto and other quick commerce platforms
- Built with React Native and Expo
- Icons from Expo Vector Icons
- Images from Unsplash

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: support@quickmart.com

---

**QuickMart** - Delivering groceries in 10 minutes! 🚚⚡ 