import Medicine from '../models/medicine.model.js';

// Create Medicine
const createMedicine = async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      medicineImage: req.file ? req.file.path : null
    };

    const medicine = await Medicine.create(medicineData);
    await medicine.populate('supplier', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: {
        medicine
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add medicine',
      error: error.message
    });
  }
};

// Get All Medicines
const getAllMedicines = async (req, res) => {
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
        { genericName: { $regex: req.query.search, $options: 'i' } },
        { manufacturer: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Stock status filter
    if (req.query.stockStatus === 'lowStock') {
      query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
    } else if (req.query.stockStatus === 'outOfStock') {
      query.quantity = 0;
    }

    // Active/Inactive filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const medicines = await Medicine.find(query)
      .populate('supplier', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Medicines retrieved successfully',
      data: {
        medicines,
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
      message: 'Failed to get medicines',
      error: error.message
    });
  }
};

// Get Medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('supplier', 'name email phone address contactPerson');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine retrieved successfully',
      data: {
        medicine
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get medicine',
      error: error.message
    });
  }
};

// Update Medicine
const updateMedicine = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Add image if uploaded
    if (req.file) {
      updateData.medicineImage = req.file.path;
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('supplier', 'name email phone');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: {
        medicine
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message
    });
  }
};

// Delete Medicine
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete medicine',
      error: error.message
    });
  }
};

// Get Low Stock Medicines
const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
      isActive: true
    }).populate('supplier', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Low stock medicines retrieved successfully',
      data: {
        count: medicines.length,
        medicines
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get low stock medicines',
      error: error.message
    });
  }
};

// Get Expired Medicines
const getExpiredMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      expiryDate: { $lte: new Date() },
      isActive: true
    }).populate('supplier', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Expired medicines retrieved successfully',
      data: {
        count: medicines.length,
        medicines
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get expired medicines',
      error: error.message
    });
  }
};

// Get Medicines Expiring Soon (within 30 days)
const getExpiringSoonMedicines = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const medicines = await Medicine.find({
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      },
      isActive: true
    }).populate('supplier', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Medicines expiring soon retrieved successfully',
      data: {
        count: medicines.length,
        medicines
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get medicines expiring soon',
      error: error.message
    });
  }
};

// Update Medicine Stock
const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    let newQuantity;
    if (operation === 'add') {
      newQuantity = medicine.quantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = medicine.quantity - quantity;
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }

    medicine.quantity = newQuantity;
    await medicine.save();

    res.status(200).json({
      success: true,
      message: `Stock ${operation}ed successfully`,
      data: {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          previousQuantity: operation === 'add' ? newQuantity - quantity : newQuantity + quantity,
          newQuantity: medicine.quantity,
          stockStatus: medicine.quantity <= medicine.minStockLevel ? 'Low Stock' : 'In Stock'
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
};

export {createMedicine ,getAllMedicines,getMedicineById,updateMedicine,deleteMedicine,getLowStockMedicines,getExpiredMedicines, getExpiringSoonMedicines, updateStock}