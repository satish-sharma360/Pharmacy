import Customer from '../models/customer.model.js';

// Create Customer
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customer
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Get All Customers
const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Customer type filter
    if (req.query.customerType) {
      query.customerType = req.query.customerType;
    }

    // Active/Inactive filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Gender filter
    if (req.query.gender) {
      query.gender = req.query.gender;
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        customers,
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
      message: 'Failed to get customers',
      error: error.message
    });
  }
};

// Get Customer by ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer retrieved successfully',
      data: {
        customer
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get customer',
      error: error.message
    });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: {
        customer
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

// Add Medical History
const addMedicalHistory = async (req, res) => {
  try {
    const { condition, diagnosedDate, notes } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.medicalHistory.push({
      condition,
      diagnosedDate,
      notes
    });

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Medical history added successfully',
      data: {
        customer
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add medical history',
      error: error.message
    });
  }
};

// Add Allergy
const addAllergy = async (req, res) => {
  try {
    const { allergen, reaction } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.allergies.push({
      allergen,
      reaction
    });

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Allergy information added successfully',
      data: {
        customer
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add allergy information',
      error: error.message
    });
  }
};

// Update Loyalty Points
const updateLoyaltyPoints = async (req, res) => {
  try {
    const { points, operation } = req.body; // operation: 'add' or 'subtract'
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    let newPoints;
    if (operation === 'add') {
      newPoints = customer.loyaltyPoints + points;
    } else if (operation === 'subtract') {
      newPoints = customer.loyaltyPoints - points;
      if (newPoints < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient loyalty points'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }

    const previousPoints = customer.loyaltyPoints;
    customer.loyaltyPoints = newPoints;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Loyalty points ${operation}ed successfully`,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          previousPoints,
          newPoints: customer.loyaltyPoints,
          pointsChanged: points
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update loyalty points',
      error: error.message
    });
  }
};

// Get Customer Statistics
const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ isActive: true });
    const inactiveCustomers = await Customer.countDocuments({ isActive: false });

    // Get customers by type
    const customerTypeStats = await Customer.aggregate([
      {
        $group: {
          _id: '$customerType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get customers by gender
    const genderStats = await Customer.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top customers by total purchases
    const topCustomers = await Customer.find()
      .sort({ totalPurchases: -1 })
      .limit(5)
      .select('name totalPurchases loyaltyPoints customerType');

    res.status(200).json({
      success: true,
      message: 'Customer statistics retrieved successfully',
      data: {
        overview: {
          totalCustomers,
          activeCustomers,
          inactiveCustomers
        },
        customerTypeDistribution: customerTypeStats,
        genderDistribution: genderStats,
        topCustomers
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get customer statistics',
      error: error.message
    });
  }
};

export {createCustomer ,getAllCustomers, getCustomerById ,updateCustomer ,deleteCustomer, addMedicalHistory ,addAllergy,updateLoyaltyPoints,getCustomerStats}