import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertCircle
} from 'lucide-react';

const Customers = () => {
  const { user, api } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
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
    dateOfBirth: '',
    gender: '',
    customerType: 'Regular',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  const customerTypes = ['Regular', 'VIP', 'Corporate'];
  const genderOptions = ['Male', 'Female', 'Other'];

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, filterType, pagination.currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('customerType', filterType);

      const response = await api.get(`/customers?${params}`);
      if (response.data.success) {
        setCustomers(response.data.data.customers);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
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
      dateOfBirth: '',
      gender: '',
      customerType: 'Regular',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    });
    setEditingCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingCustomer) {
        response = await api.put(`/customers/${editingCustomer._id}`, formData);
      } else {
        response = await api.post('/customers', formData);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setShowModal(false);
        resetForm();
        fetchCustomers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
      gender: customer.gender || '',
      customerType: customer.customerType,
      emergencyContact: customer.emergencyContact || {
        name: '',
        phone: '',
        relation: ''
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await api.delete(`/customers/${id}`);
        if (response.data.success) {
          toast.success('Customer deleted successfully');
          fetchCustomers();
        }
      } catch (error) {
        toast.error('Failed to delete customer');
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Customer Management
          </h2>
          <p style={{ color: '#64748b' }}>Manage your pharmacy customers</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <div className="search-filters">
            <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Types</option>
              {customerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
              <p>Loading customers...</p>
            </div>
          ) : customers.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer Info</th>
                      <th>Contact</th>
                      <th>Age/Gender</th>
                      <th>Type</th>
                      <th>Purchases</th>
                      <th>Loyalty Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer._id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {customer.name}
                            </div>
                            {customer.email && (
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <Phone size={14} />
                              {customer.phone}
                            </div>
                            {customer.address?.city && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                                <MapPin size={14} />
                                {customer.address.city}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px' }}>
                            <div>{calculateAge(customer.dateOfBirth)} years</div>
                            <div style={{ color: '#64748b' }}>{customer.gender || '-'}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            customer.customerType === 'VIP' ? 'badge-warning' :
                            customer.customerType === 'Corporate' ? 'badge-info' :
                            'badge-success'
                          }`}>
                            {customer.customerType}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#10b981' }}>
                            {formatCurrency(customer.totalPurchases)}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                            {customer.loyaltyPoints} pts
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(customer)}
                              className="btn btn-sm btn-secondary"
                              title="Edit Customer"
                            >
                              <Edit size={16} />
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDelete(customer._id)}
                                className="btn btn-sm btn-danger"
                                title="Delete Customer"
                              >
                                <Trash2 size={16} />
                              </button>
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
              <Users size={64} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#64748b' }} />
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>No customers found</h3>
              <p style={{ color: '#64748b' }}>Add your first customer to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                    <label className="form-label">Full Name *</label>
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
                    <label className="form-label">Phone Number *</label>
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select Gender</option>
                      {genderOptions.map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      {customerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address Section */}
                <h4 style={{ marginBottom: '16px', color: '#374151' }}>Address Information</h4>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className="form-input"
                      pattern="[0-9]{6}"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <h4 style={{ marginBottom: '16px', color: '#374151' }}>Emergency Contact</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      pattern="[0-9]{10}"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Relation</label>
                    <input
                      type="text"
                      name="emergencyContact.relation"
                      value={formData.emergencyContact.relation}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
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
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
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

export default Customers;