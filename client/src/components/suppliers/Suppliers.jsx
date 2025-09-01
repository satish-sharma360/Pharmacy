import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck,
  Phone,
  Mail,
  MapPin,
  Star
} from 'lucide-react';

const Suppliers = () => {
  const { user, api } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    contactPerson: '',
    gstNumber: '',
    licenseNumber: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    },
    paymentTerms: 'Cash',
    rating: 5,
    notes: ''
  });

  const paymentTermsOptions = ['Cash', 'Credit-15', 'Credit-30', 'Credit-45', 'Credit-60'];

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, pagination.currentPage]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10
      });
      
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/suppliers?${params}`);
      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      contactPerson: '',
      gstNumber: '',
      licenseNumber: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: ''
      },
      paymentTerms: 'Cash',
      rating: 5,
      notes: ''
    });
    setEditingSupplier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingSupplier) {
        response = await api.put(`/suppliers/${editingSupplier._id}`, formData);
      } else {
        response = await api.post('/suppliers', formData);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setShowModal(false);
        resetForm();
        fetchSuppliers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      contactPerson: supplier.contactPerson,
      gstNumber: supplier.gstNumber,
      licenseNumber: supplier.licenseNumber,
      bankDetails: supplier.bankDetails || {
        bankName: '',
        accountNumber: '',
        ifscCode: ''
      },
      paymentTerms: supplier.paymentTerms,
      rating: supplier.rating,
      notes: supplier.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const response = await api.delete(`/suppliers/${id}`);
        if (response.data.success) {
          toast.success('Supplier deleted successfully');
          fetchSuppliers();
        }
      } catch (error) {
        toast.error('Failed to delete supplier');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? '#fbbf24' : 'none'}
        color={i < rating ? '#fbbf24' : '#d1d5db'}
      />
    ));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Supplier Management
          </h2>
          <p style={{ color: '#64748b' }}>Manage your pharmacy suppliers</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'pharmacist') && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Add Supplier
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} 
            />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
              <p>Loading suppliers...</p>
            </div>
          ) : suppliers.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Supplier Info</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Payment Terms</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {supplier.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Contact: {supplier.contactPerson}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              GST: {supplier.gstNumber}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <Phone size={14} />
                              {supplier.phone}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={14} />
                              {supplier.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px' }}>
                            <div>{supplier.address.city}</div>
                            <div style={{ color: '#64748b' }}>{supplier.address.state}</div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{supplier.paymentTerms}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {renderStars(supplier.rating)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${supplier.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(user?.role === 'admin' || user?.role === 'pharmacist') && (
                              <>
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="btn btn-sm btn-secondary"
                                  title="Edit Supplier"
                                >
                                  <Edit size={16} />
                                </button>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDelete(supplier._id)}
                                    className="btn btn-sm btn-danger"
                                    title="Delete Supplier"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <span style={{ padding: '8px 16px', color: '#64748b' }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <Truck size={64} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#64748b' }} />
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>No suppliers found</h3>
              <p style={{ color: '#64748b' }}>Add your first supplier to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Supplier Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Contact Person *</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>

                {/* Address Section */}
                <h4 style={{ marginBottom: '16px', color: '#374151' }}>Address Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Street Address *</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className="form-input"
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                </div>

                {/* Business Information */}
                <h4 style={{ marginBottom: '16px', color: '#374151' }}>Business Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GST Number *</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="22AAAAA0000A1Z5"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <select
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      {paymentTermsOptions.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      {[1, 2, 3, 4, 5].map(rating => (
                        <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bank Details */}
                <h4 style={{ marginBottom: '16px', color: '#374151' }}>Bank Details (Optional)</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      name="bankDetails.bankName"
                      value={formData.bankDetails.bankName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      name="bankDetails.accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      name="bankDetails.ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="HDFC0000001"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Additional notes about supplier..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;