import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: [100, 'Medicine name cannot exceed 100 characters']
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true,
    maxlength: [100, 'Generic name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 
      'Drops', 'Inhaler', 'Spray', 'Other'
    ]
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    maxlength: [100, 'Manufacturer name cannot exceed 100 characters']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  manufacturingDate: {
    type: Date,
    required: [true, 'Manufacturing date is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  medicineImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for profit calculation
medicineSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.costPrice;
});

// Virtual for profit percentage
medicineSchema.virtual('profitPercentage').get(function() {
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Virtual for stock status
medicineSchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) return 'Out of Stock';
  if (this.quantity <= this.minStockLevel) return 'Low Stock';
  return 'In Stock';
});

// Index for faster searches
medicineSchema.index({ name: 'text', genericName: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
