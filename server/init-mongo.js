// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('shopdb');

// Create admin user
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [
    {
      role: 'readWrite',
      db: 'shopdb'
    }
  ]
});

// Create collections and indexes
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('carts');
db.createCollection('orders');

// Create default admin user
db.users.insertOne({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@shop.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', // admin123
  role: 'admin',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create default categories
const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and accessories',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Books and educational materials',
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home improvement and garden supplies',
    isActive: true,
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.categories.insertMany(categories);

print('Database initialized successfully');
