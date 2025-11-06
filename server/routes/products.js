const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { authenticate, authorizeAdmin, optionalAuth } = require('../middleware/auth');
const { validateProductCreation, validateProductUpdate } = require('../middleware/validation');

const router = express.Router();

// Get all products with pagination, filtering, and sorting
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc',
      featured,
      status = 'active'
    } = req.query;

    // Build query
    const query = { status };

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to get products', error: error.message });
  }
});

// Get single product by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by slug first, then by ID
    let product;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: identifier }).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'active') {
      return res.status(404).json({ message: 'Product not available' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to get product', error: error.message });
  }
});

// Create new product (admin only)
router.post('/', authenticate, authorizeAdmin, validateProductCreation, async (req, res) => {
  try {
    const productData = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Validate category exists
    const category = await Category.findById(productData.category);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const product = new Product(productData);
    await product.save();

    await product.populate('category', 'name slug');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product (admin only)
router.put('/:id', authenticate, authorizeAdmin, validateProductUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if SKU is being changed and if it already exists
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: updateData.sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    // Validate category if being updated
    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    Object.assign(product, updateData);
    await product.save();

    await product.populate('category', 'name slug');

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ featured: true, status: 'active' })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Failed to get featured products', error: error.message });
  }
});

// Get related products
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      status: 'active'
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ products: relatedProducts });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({ message: 'Failed to get related products', error: error.message });
  }
});

module.exports = router;
