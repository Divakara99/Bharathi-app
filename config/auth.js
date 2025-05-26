// Real User Credentials Configuration
// Replace these with your actual user credentials

export const USER_CREDENTIALS = {
  admin: {
    email: 'admin@bharathienterprises.com',
    password: 'BharathiAdmin2024!',
    name: 'Administrator',
    role: 'admin',
    permissions: ['all']
  },
  delivery: [
    {
      id: 'DEL001',
      email: 'delivery1@bharathienterprises.com',
      password: 'Delivery2024!',
      name: 'Ravi Kumar',
      phone: '+91 9876543210',
      role: 'delivery',
      area: 'Zone A',
      vehicle: 'Bike - KA01AB1234'
    },
    {
      id: 'DEL002',
      email: 'delivery2@bharathienterprises.com',
      password: 'Delivery2024!',
      name: 'Suresh Reddy',
      phone: '+91 9876543211',
      role: 'delivery',
      area: 'Zone B',
      vehicle: 'Bike - KA01CD5678'
    }
  ],
  customers: [
    {
      id: 'CUST001',
      email: 'customer1@gmail.com',
      password: 'Customer123!',
      name: 'Priya Sharma',
      phone: '+91 9876543212',
      address: '123 MG Road, Bangalore',
      role: 'customer'
    },
    {
      id: 'CUST002',
      email: 'customer2@gmail.com',
      password: 'Customer123!',
      name: 'Rajesh Gupta',
      phone: '+91 9876543213',
      address: '456 Brigade Road, Bangalore',
      role: 'customer'
    }
  ]
};

// Company Information
export const COMPANY_INFO = {
  name: 'BHARATHI ENTERPRISES',
  address: 'Bangalore, Karnataka, India',
  phone: '+91 80 1234 5678',
  email: 'info@bharathienterprises.com',
  website: 'www.bharathienterprises.com',
  gst: 'GST123456789',
  established: '2020'
};

// Bank Details for Payment Collection
export const BANK_DETAILS = {
  accountName: 'BHARATHI ENTERPRISES',
  accountNumber: '1234567890123456',
  bankName: 'State Bank of India',
  branchName: 'MG Road Branch, Bangalore',
  ifscCode: 'SBIN0001234',
  swiftCode: 'SBININBB123',
  accountType: 'Current Account',
  upiId: 'bharathi@sbi',
  phonePayNumber: '+91 9876543210',
  googlePayNumber: '+91 9876543210',
  paytmNumber: '+91 9876543210'
};

// App Configuration
export const APP_CONFIG = {
  enableDemoMode: false, // Set to false to disable demo credentials
  requireEmailVerification: true,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 3,
  lockoutDuration: 15 * 60 * 1000 // 15 minutes
}; 