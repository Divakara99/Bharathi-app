# Bharathi Delivery App

A Zepto-like delivery application built with Next.js, TypeScript, and Supabase. This app supports three user roles: Owner, Customer, and Delivery Partner with real-time features.

## Features

### 🏪 Owner Dashboard
- **Analytics Dashboard**: View total orders, customers, revenue, and delivery partners
- **Product Management**: Add, edit, delete products with categories and stock management
- **Order Management**: Monitor all orders and their status
- **Delivery Partner Management**: View and manage delivery partners
- **Real-time Updates**: Live order tracking and notifications

### 🛒 Customer App
- **Product Browsing**: Browse products by categories
- **Shopping Cart**: Add/remove items with quantity management
- **Order Placement**: Place orders with delivery address
- **Order Tracking**: Real-time order status updates
- **Order History**: View past orders and their status

### 🚚 Delivery Partner App
- **Availability Toggle**: Set availability status
- **Order Assignment**: View assigned deliveries
- **Real-time Updates**: Live order status updates
- **Location Tracking**: Update current location
- **Order Management**: Update order status (pickup, delivery, etc.)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context + Zustand
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bharathi-delivery-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script to create all tables and policies

### 5. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:3000`)
3. Add redirect URLs for authentication

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

### Owner Account
- **Email**: Akhildivakara@gmail.com
- **Password**: 9959827826Dd@

## User Roles

### Owner
- Full access to all features
- Manage products, orders, and delivery partners
- View analytics and business insights

### Customer
- Browse and purchase products
- Manage shopping cart
- Track orders in real-time

### Delivery Partner
- Accept and manage deliveries
- Update order status
- Track location and availability

## Database Schema

The app uses the following main tables:

- **users**: User accounts with role-based access
- **products**: Product catalog with categories and stock
- **orders**: Order management with status tracking
- **order_items**: Individual items in each order
- **delivery_partners**: Delivery partner profiles
- **cart**: Customer shopping carts
- **cart_items**: Items in shopping carts
- **order_tracking**: Real-time order status updates

## Real-time Features

- Live order status updates
- Real-time notifications
- Live delivery tracking
- Instant inventory updates

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@bharathienterprises.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced search and filters
- [ ] Loyalty program
- [ ] Bulk order management
