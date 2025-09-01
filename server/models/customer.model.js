import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  address: {
    street: {
      type: String,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    }
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  medicalHistory: [{
    condition: {
      type: String,
      maxlength: [100, 'Medical condition cannot exceed 100 characters']
    },
    diagnosedDate: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  allergies: [{
    allergen: {
      type: String,
      maxlength: [100, 'Allergen name cannot exceed 100 characters']
    },
    reaction: {
      type: String,
      maxlength: [200, 'Reaction description cannot exceed 200 characters']
    }
  }],
  insuranceDetails: {
    provider: {
      type: String,
      maxlength: [100, 'Insurance provider cannot exceed 100 characters']
    },
    policyNumber: {
      type: String,
      maxlength: [50, 'Policy number cannot exceed 50 characters']
    },
    validUntil: {
      type: Date
    }
  },
  emergencyContact: {
    name: {
      type: String,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    relation: {
      type: String,
      maxlength: [50, 'Relation cannot exceed 50 characters']
    }
  },
  customerType: {
    type: String,
    enum: ['Regular', 'VIP', 'Corporate'],
    default: 'Regular'
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for age calculation
customerSchema.virtual('age').get(function() {
  if (this.dateOfBirth) {
    return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }
  return null;
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
