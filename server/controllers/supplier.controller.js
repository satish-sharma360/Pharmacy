import Supplier from '../models/supplier.model.js';

const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: {
        supplier
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    });
  }
};

// Get All Suppliers
const getAllSuppliers = async (req, res) => {
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
        { contactPerson: { $regex: req.query.search, $options: 'i' } },
        { 'address.city': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Active/Inactive filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Payment terms filter
    if (req.query.paymentTerms) {
      query.paymentTerms = req.query.paymentTerms;
    }

    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Suppliers retrieved successfully',
      data: {
        suppliers,
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
      message: 'Failed to get suppliers',
      error: error.message
    });
  }
};

// Get Supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier retrieved successfully',
      data: {
        supplier
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get supplier',
      error: error.message
    });
  }
};

// Update Supplier
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: {
        supplier
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
};

// Delete Supplier
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
};

// Toggle Supplier Status
const toggleSupplierStatus = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.name,
          isActive: supplier.isActive
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to toggle supplier status',
      error: error.message
    });
  }
};

// Get Supplier Statistics
const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });
    const inactiveSuppliers = await Supplier.countDocuments({ isActive: false });

    // Get suppliers by payment terms
    const paymentTermsStats = await Supplier.aggregate([
      {
        $group: {
          _id: '$paymentTerms',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get suppliers by rating
    const ratingStats = await Supplier.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Supplier statistics retrieved successfully',
      data: {
        overview: {
          totalSuppliers,
          activeSuppliers,
          inactiveSuppliers
        },
        paymentTermsDistribution: paymentTermsStats,
        ratingDistribution: ratingStats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get supplier statistics',
      error: error.message
    });
  }
};

export { createSupplier ,getAllSuppliers,getSupplierById ,updateSupplier , deleteSupplier, toggleSupplierStatus, getSupplierStats}