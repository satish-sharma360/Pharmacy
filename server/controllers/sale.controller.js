import Sale from '../models/sales.model.js';
import Medicine from '../models/medicine.model.js';
import Customer from '../models/customer.model.js';

// Create Sale
const createSale = async (req, res) => {
  try {
    let { customer, items, paymentMethod, paidAmount, doctorName, notes } = req.body;

    console.log('Received sale data:', req.body);
    console.log('File uploaded:', req.file);

    // Validate required fields
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required'
      });
    }

    if (!items) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid paid amount is required'
      });
    }

    // Parse items if they come as string from FormData
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (parseError) {
        console.error('Items parsing error:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid items format'
        });
      }
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine is required for item ${i + 1}`
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Valid quantity is required for item ${i + 1}`
        });
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Valid unit price is required for item ${i + 1}`
        });
      }
    }

    // Verify customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate stock availability for all items
    const stockErrors = [];
    for (let item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicine} not found`
        });
      }
      
      if (medicine.quantity < item.quantity) {
        stockErrors.push(`Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Requested: ${item.quantity}`);
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: stockErrors.join('; ')
      });
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    
    const processedItems = [];
    
    for (let item of items) {
      const medicine = await Medicine.findById(item.medicine);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discount = Number(item.discount) || 0;
      
      const itemTotal = quantity * unitPrice;
      
      processedItems.push({
        medicine: item.medicine,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: itemTotal - discount,
        discount: discount
      });
      
      subtotal += itemTotal;
      totalDiscount += discount;
    }

    const tax = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal - totalDiscount + tax;
    const paidAmountNum = Number(paidAmount);
    
    // Validate payment amount
    if (paidAmountNum < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Paid amount (${paidAmountNum}) is less than total amount (${totalAmount.toFixed(2)})`
      });
    }

    const changeAmount = paidAmountNum > totalAmount ? paidAmountNum - totalAmount : 0;

    // Generate invoice number
    const lastSale = await Sale.findOne().sort({ createdAt: -1 });
    let invoiceNumber;
    if (lastSale && lastSale.invoiceNumber) {
      const lastNumber = parseInt(lastSale.invoiceNumber.split('-')[1]) || 0;
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;
    } else {
      invoiceNumber = 'INV-000001';
    }

    // Create sale data
    const saleData = {
      invoiceNumber,
      customer,
      items: processedItems,
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      paymentMethod,
      paidAmount: paidAmountNum,
      changeAmount: Number(changeAmount.toFixed(2)),
      paymentStatus: paidAmountNum >= totalAmount ? 'Paid' : 'Partial',
      doctorName: doctorName || '',
      notes: notes || '',
      soldBy: req.user.id,
      prescriptionImage: req.file ? req.file.path : null,
      saleDate: new Date()
    };

    console.log('Creating sale with data:', saleData);

    // Create sale
    const sale = await Sale.create(saleData);

    // Update medicine quantities in a transaction-like manner
    const medicineUpdates = [];
    for (let item of items) {
      try {
        const updateResult = await Medicine.findByIdAndUpdate(
          item.medicine,
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );
        
        if (!updateResult) {
          throw new Error(`Failed to update medicine ${item.medicine}`);
        }
        
        medicineUpdates.push({
          medicineId: item.medicine,
          quantityReduced: item.quantity,
          newQuantity: updateResult.quantity
        });
      } catch (updateError) {
        console.error('Medicine update error:', updateError);
        // If medicine update fails, we should ideally rollback the sale
        // For now, log the error and continue
      }
    }

    // Update customer's total purchases and loyalty points
    try {
      if (customerDoc) {
        customerDoc.totalPurchases = (customerDoc.totalPurchases || 0) + totalAmount;
        customerDoc.loyaltyPoints = (customerDoc.loyaltyPoints || 0) + Math.floor(totalAmount / 100);
        await customerDoc.save();
      }
    } catch (customerUpdateError) {
      console.error('Customer update error:', customerUpdateError);
      // Continue even if customer update fails
    }

    // Populate sale data for response
    await sale.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.medicine', select: 'name genericName manufacturer' },
      { path: 'soldBy', select: 'name email' }
    ]);

    console.log('Sale created successfully:', sale._id);

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        sale,
        medicineUpdates
      }
    });

  } catch (error) {
    console.error('Sale creation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create sale';
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      errorMessage = `Validation error: ${validationErrors.join(', ')}`;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format provided';
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate invoice number detected';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get All Sales
const getAllSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.saleDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Payment method filter
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }

    // Payment status filter
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    // Search by invoice number or customer
    if (req.query.search) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { phone: { $regex: req.query.search, $options: 'i' } }
        ]
      }).select('_id');
      
      const customerIds = customers.map(c => c._id);
      
      query.$or = [
        { invoiceNumber: { $regex: req.query.search, $options: 'i' } },
        { customer: { $in: customerIds } }
      ];
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name phone email')
      .populate('items.medicine', 'name genericName')
      .populate('soldBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Sale.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Sales retrieved successfully',
      data: {
        sales,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get sales',
      error: error.message
    });
  }
};

// Get Sale by ID
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('items.medicine')
      .populate('soldBy', 'name email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sale retrieved successfully',
      data: {
        sale
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get sale',
      error: error.message
    });
  }
};

// Get Sales Analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    // Total sales and revenue
    const salesStats = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$totalDiscount' }
        }
      }
    ]);

    // Sales by payment method
    const paymentMethodStats = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Top selling medicines
    const topMedicines = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'medicines',
          localField: '_id',
          foreignField: '_id',
          as: 'medicineInfo'
        }
      },
      { $unwind: '$medicineInfo' },
      {
        $project: {
          medicineName: '$medicineInfo.name',
          genericName: '$medicineInfo.genericName',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Daily sales trend
    const dailySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' }
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Sales analytics retrieved successfully',
      data: {
        period,
        dateRange: { startDate, endDate },
        overview: salesStats[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalTax: 0,
          totalDiscount: 0
        },
        paymentMethodDistribution: paymentMethodStats,
        topSellingMedicines: topMedicines,
        dailyTrend: dailySales
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get sales analytics',
      error: error.message
    });
  }
};

// Update Sale Status
const updateSaleStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate('customer', 'name phone');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sale status updated successfully',
      data: {
        sale: {
          id: sale._id,
          invoiceNumber: sale.invoiceNumber,
          paymentStatus: sale.paymentStatus,
          customer: sale.customer
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update sale status',
      error: error.message
    });
  }
};

export {createSale ,getAllSales ,getSaleById, getSalesAnalytics ,updateSaleStatus}