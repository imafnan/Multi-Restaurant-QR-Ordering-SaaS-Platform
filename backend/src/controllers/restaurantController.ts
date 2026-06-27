import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Restaurant } from '../models/Restaurant';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Alert } from '../models/Alert';
import { ProductSales } from '../models/ProductSales';
import { DailyAnalytics } from '../models/DailyAnalytics';
import { storageService } from '../services/storageService';

// -------------------------------------------------------------
// 1. Dashboard Statistics
// -------------------------------------------------------------
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant association missing' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Today's Sales (Only accepted or completed orders placed today)
    const todayOrders = await Order.find({
      restaurantId,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const acceptedOrdersToday = todayOrders.filter(
      o => o.status === 'accepted' || o.status === 'completed'
    );

    const salesToday = acceptedOrdersToday.reduce((sum, o) => sum + o.grandTotal, 0);

    // 2. Total Orders Today (Only accepted/completed)
    const totalOrdersToday = acceptedOrdersToday.length;

    // 3. Total Categories
    const totalCategories = await Category.countDocuments({ restaurantId });

    // 4. Total Products
    const totalProducts = await Product.countDocuments({ restaurantId });

    // 5. Total Visitors
    const restaurant = await Restaurant.findById(restaurantId);
    const totalVisitors = restaurant ? restaurant.visitorsCount : 0;

    return res.status(200).json({
      salesToday,
      totalOrdersToday,
      totalCategories,
      totalProducts,
      totalVisitors
    });
  } catch (error) {
    console.error('Restaurant stats error:', error);
    return res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// -------------------------------------------------------------
// 2. Categories Module
// -------------------------------------------------------------
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { search } = req.query;

    const query: any = { restaurantId };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(query).sort({ createdAt: -1 });
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Server error fetching categories' });
  }
};

export const addCategory = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.create({
      restaurantId,
      name: name.trim(),
      status: status || 'active'
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Add category error:', error);
    return res.status(500).json({ message: 'Server error adding category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const category = await Category.findOne({ _id: id, restaurantId: req.restaurantId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) category.name = name.trim();
    if (status) category.status = status;

    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Server error updating category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId;

    const category = await Category.findOne({ _id: id, restaurantId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.name.toLowerCase() === 'uncategorized') {
      return res.status(400).json({ message: 'Cannot delete the system Uncategorized category.' });
    }

    // Find or create "Uncategorized" category for this restaurant
    let uncategorized = await Category.findOne({
      restaurantId,
      name: 'Uncategorized'
    });

    if (!uncategorized) {
      uncategorized = await Category.create({
        restaurantId,
        name: 'Uncategorized',
        status: 'active'
      });
    }

    // Move all products belonging to this category to Uncategorized
    await Product.updateMany(
      { restaurantId, categoryId: category._id },
      { categoryId: uncategorized._id }
    );

    // Delete the category
    await Category.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Category deleted. Products moved to Uncategorized.' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Server error deleting category' });
  }
};

// -------------------------------------------------------------
// 3. Products Module
// -------------------------------------------------------------
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { search, category, status } = req.query;

    const query: any = { restaurantId };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.categoryId = category;
    }
    if (status) {
      query.status = status;
    }

    const products = await Product.find(query).populate('categoryId', 'name').sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Server error fetching products' });
  }
};

export const addProduct = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { name, description, price, discountPrice, categoryId, quantity, status, variants } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'Product name, price, and category are required' });
    }

    // Handle uploaded files
    const images: string[] = [];
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await storageService.uploadFile(file);
        images.push(url);
      }
    }

    // Parse variants if passed as string JSON
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        console.error('Failed to parse variants JSON:', err);
      }
    }

    const product = await Product.create({
      restaurantId,
      categoryId,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      images,
      image: images.length > 0 ? images[0] : '',
      status: status || 'active',
      quantity: quantity !== undefined && quantity !== '' ? Number(quantity) : undefined,
      variants: parsedVariants,
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Add product error:', error);
    return res.status(500).json({ message: 'Server error adding product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId;
    const { name, description, price, discountPrice, categoryId, quantity, status, variants, existingImages } = req.body;

    const product = await Product.findOne({ _id: id, restaurantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle existing images to keep
    let finalImages: string[] = [];
    if (existingImages) {
      finalImages = typeof existingImages === 'string' ? [existingImages] : existingImages;
    }

    // Identify deleted images to remove from storage
    const deletedImages = product.images.filter(img => !finalImages.includes(img));
    for (const img of deletedImages) {
      await storageService.deleteFile(img);
    }

    // Handle new uploads
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await storageService.uploadFile(file);
        finalImages.push(url);
      }
    }

    // Cap at 3 images
    finalImages = finalImages.slice(0, 3);

    // Parse variants
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        console.error('Failed to parse variants JSON:', err);
      }
    }

    if (name) product.name = name.trim();
    product.description = description !== undefined ? description.trim() : product.description;
    if (price !== undefined) product.price = Number(price);
    product.discountPrice = discountPrice !== undefined && discountPrice !== '' ? Number(discountPrice) : undefined;
    if (categoryId) product.categoryId = categoryId;
    product.quantity = quantity !== undefined && quantity !== '' ? Number(quantity) : undefined;
    if (status) product.status = status;
    if (variants !== undefined) product.variants = parsedVariants;
    product.images = finalImages;
    product.image = finalImages.length > 0 ? finalImages[0] : '';

    await product.save();
    return res.status(200).json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Server error updating product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId;

    const product = await Product.findOne({ _id: id, restaurantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated files
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        await storageService.deleteFile(img);
      }
    }

    await Product.findByIdAndDelete(id);
    // Clean up ProductSales records to prevent orphan data
    await ProductSales.deleteMany({ productId: id });
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Server error deleting product' });
  }
};

// -------------------------------------------------------------
// 4. Restaurant Settings Page
// -------------------------------------------------------------
export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.status(200).json({
      logo: restaurant.logo,
      banner: restaurant.banner,
      vatPercentage: restaurant.vatPercentage,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ message: 'Server error fetching settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { vatPercentage } = req.body;
    if (vatPercentage !== undefined) {
      restaurant.vatPercentage = Number(vatPercentage);
    }

    // Handle files if uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files['logo'] && files['logo'][0]) {
        // Delete old logo
        if (restaurant.logo) {
          await storageService.deleteFile(restaurant.logo);
        }
        const logoUrl = await storageService.uploadFile(files['logo'][0]);
        restaurant.logo = logoUrl;
      }

      if (files['banner'] && files['banner'][0]) {
        // Delete old banner
        if (restaurant.banner) {
          await storageService.deleteFile(restaurant.banner);
        }
        const bannerUrl = await storageService.uploadFile(files['banner'][0]);
        restaurant.banner = bannerUrl;
      }
    }

    await restaurant.save();

    return res.status(200).json({
      message: 'Branding settings updated successfully',
      settings: {
        logo: restaurant.logo,
        banner: restaurant.banner,
        vatPercentage: restaurant.vatPercentage,
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: 'Server error updating branding settings' });
  }
};

// -------------------------------------------------------------
// 5. Orders Management
// -------------------------------------------------------------
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { search, status, page, limit } = req.query;

    const query: any = { restaurantId };
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Search filter
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { orderId: searchRegex },
        { fullName: searchRegex },
        { phone: searchRegex },
        { tableNumber: searchRegex }
      ];
    }

    // Pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.status(200).json({
      orders,
      totalPages,
      currentPage: pageNum,
      totalCount
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Server error fetching orders' });
  }
};

export const clearOrders = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { status } = req.query;

    if (!status || !['pending', 'accepted', 'completed', 'cancelled'].includes(status as string)) {
      return res.status(400).json({ message: 'Valid status filter is required' });
    }

    await Order.deleteMany({ restaurantId, status });
    return res.status(200).json({ message: `Cleared all ${status} orders successfully` });
  } catch (error) {
    console.error('Clear orders error:', error);
    return res.status(500).json({ message: 'Server error clearing orders' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const restaurantId = req.restaurantId;

    if (!['pending', 'accepted', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // Side effects only when transitioning from pending -> accepted (or completed if needed)
    if (status === 'accepted' && oldStatus === 'pending') {
      // 1. Stock quantity reduction (if quantity limit used)
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          if (product.quantity !== undefined) {
            product.quantity = Math.max(0, product.quantity - item.quantity);
            await product.save();
          }

          // 2. Increment Lifetime Sales History (Decoupled from order records deletion)
          let resolvedCatName = 'Uncategorized';
          if (product.categoryId) {
            const cat = await Category.findById(product.categoryId);
            if (cat) resolvedCatName = cat.name;
          }

          await ProductSales.findOneAndUpdate(
            { restaurantId, productId: product._id, variantName: item.variantName || '' },
            { 
              $inc: { totalSold: item.quantity },
              $setOnInsert: { 
                productName: product.name,
                categoryName: resolvedCatName
              } 
            },
            { upsert: true, new: true }
          );
        }
      }

      // 3. Daily Sales Analytics aggregation
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      await DailyAnalytics.findOneAndUpdate(
        { restaurantId, date: startOfToday },
        { 
          $inc: { 
            sales: order.grandTotal, 
            ordersCount: 1 
          } 
        },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Server error updating order status' });
  }
};

// -------------------------------------------------------------
// 6. Product Analysis & Sales Dashboard
// -------------------------------------------------------------
export const getProductAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;
    const { search } = req.query;

    const query: any = { restaurantId };
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { productName: searchRegex },
        { categoryName: searchRegex }
      ];
    }

    const list = await ProductSales.find(query).sort({ totalSold: -1 });
    return res.status(200).json(list);
  } catch (error) {
    console.error('Product analysis error:', error);
    return res.status(500).json({ message: 'Server error loading product analysis data' });
  }
};

export const getMonthlyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.restaurantId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Daily Sales
    const todayRecord = await DailyAnalytics.findOne({ restaurantId, date: startOfToday });
    const dailySales = todayRecord ? todayRecord.sales : 0;

    // 2. Monthly Sales (Sum of daily sales in this month)
    const monthlySum = await DailyAnalytics.aggregate([
      { $match: { restaurantId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$sales' } } }
    ]);
    const monthlySales = monthlySum.length > 0 ? monthlySum[0].total : 0;

    // 3. Total Accepted Orders
    const totalAcceptedSum = await DailyAnalytics.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: null, total: { $sum: '$ordersCount' } } }
    ]);
    const totalAcceptedOrders = totalAcceptedSum.length > 0 ? totalAcceptedSum[0].total : 0;

    // 4. Best Selling Product (Grouped sum from ProductSales)
    const bestProductAgg = await ProductSales.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: '$productId', productName: { $first: '$productName' }, totalSold: { $sum: '$totalSold' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 1 }
    ]);
    const bestSellingProduct = bestProductAgg.length > 0 
      ? `${bestProductAgg[0].productName} (${bestProductAgg[0].totalSold} sold)`
      : 'None';

    // 5. Best Selling Variant
    const bestVariantAgg = await ProductSales.aggregate([
      { $match: { restaurantId, variantName: { $ne: '' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 1 }
    ]);
    const bestSellingVariant = bestVariantAgg.length > 0 
      ? `${bestVariantAgg[0].productName} - ${bestVariantAgg[0].variantName} (${bestVariantAgg[0].totalSold} sold)`
      : 'None';

    return res.status(200).json({
      dailySales,
      monthlySales,
      totalAcceptedOrders,
      bestSellingProduct,
      bestSellingVariant
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    return res.status(500).json({ message: 'Server error loading monthly analytics' });
  }
};
