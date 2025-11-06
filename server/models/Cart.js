const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  sessionToken: {
    type: String,
    unique: true,
    sparse: true
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Index for efficient queries
cartSchema.index({ user: 1 });
cartSchema.index({ sessionToken: 1 });

// Pre-save middleware to update timestamp
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, price, variant = null) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    (variant ? item.variant?.toString() === variant.toString() : !item.variant)
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      variant: variant,
      quantity: quantity,
      price: price
    });
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity, variant = null) {
  const itemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    (variant ? item.variant?.toString() === variant.toString() : !item.variant)
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
    }
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, variant = null) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId.toString() && 
      (variant ? item.variant?.toString() === variant.toString() : !item.variant))
  );

  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
