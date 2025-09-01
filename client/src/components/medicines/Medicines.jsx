import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  Eye
} from 'lucide-react';

const Medicines = () => {
  const { user, api } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    manufacturingDate: '',
    quantity: '',
    minStockLevel: '',
    costPrice: '',
    sellingPrice: '',
    supplier: '',
    description: '',
    prescriptionRequired: false,
    medicineImage: null
  });

  const categories = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 
    'Ointment', 'Drops', 'Inhaler', 'Spray', 'Other'
  ];

  useEffect(() => {
    fetchMedicines();
    fetchSuppliers();
  }, [searchTerm, filterCategory, filterStockStatus, pagination.currentPage]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (filterStockStatus) params.append('stockStatus', filterStockStatus);

      const response = await api.get(`/medicines?${params}`);
      if (response.data.success) {
        setMedicines(response.data.data.medicines);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers?limit=100');
      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      batchNumber: '',
      expiryDate: '',
      manufacturingDate: '',
      quantity: '',
      minStockLevel: '',
      costPrice: '',
      sellingPrice: '',
      supplier: '',
      description: '',
      prescriptionRequired: false,
      medicineImage: null
    });
    setEditingMedicine(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'medicineImage' && formData[key]) {
        submitData.append('medicineImage', formData[key]);
      } else {
        submitData.append(key, formData[key]);
      }
    });

    try {
      let response;
      if (editingMedicine) {
        response = await api.put(`/medicines/${editingMedicine._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/medicines', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setShowModal(false);
        resetForm();
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
      manufacturer: medicine.manufacturer,
      batchNumber: medicine.batchNumber,
      expiryDate: medicine.expiryDate.split('T')[0],
      manufacturingDate: medicine.manufacturingDate.split('T')[0],
      quantity: medicine.quantity,
      minStockLevel: medicine.minStockLevel,
      costPrice: medicine.costPrice,
      sellingPrice: medicine.sellingPrice,
      supplier: medicine.supplier._id,
      description: medicine.description || '',
      prescriptionRequired: medicine.prescriptionRequired,
      medicineImage: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        const response = await api.delete(`/medicines/${id}`);
        if (response.data.success) {
          toast.success('Medicine deleted successfully');
          fetchMedicines();
        }
      } catch (error) {
        toast.error('Failed to delete medicine');
      }
    }
  };

  const getStockStatus = (medicine) => {
    if (medicine.quantity <= 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    } else if (medicine.quantity <= medicine.minStockLevel) {
      return <span className="badge badge-warning">Low Stock</span>;
    } else {
      return <span className="badge badge-success">In Stock</span>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Medicine Inventory
          </h2>
          <p style={{ color: '#64748b' }}>Manage your pharmacy's medicine stock</p>
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
            Add Medicine
          </button>
        )}
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
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-select"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value)}
              className="form-select"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Stock Status</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
              <p>Loading medicines...</p>
            </div>
          ) : medicines.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th>Supplier</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((medicine) => (
                      <tr key={medicine._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {medicine.medicineImage ? (
                              <img
                                src={`http://localhost:8082/${medicine.medicineImage}`}
                                alt={medicine.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '8px',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '40px',
                                height: '40px',
                                background: '#f1f5f9',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Package size={20} color="#64748b" />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: '600' }}>{medicine.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {medicine.genericName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{medicine.category}</span>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600' }}>{medicine.quantity}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Min: {medicine.minStockLevel}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600', color: '#10b981' }}>
                              {formatCurrency(medicine.sellingPrice)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Cost: {formatCurrency(medicine.costPrice)}
                            </div>
                          </div>
                        </td>
                        <td>{medicine.supplier?.name}</td>
                        <td>
                          <div style={{ fontSize: '14px' }}>
                            {new Date(medicine.expiryDate).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td>{getStockStatus(medicine)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(user?.role === 'admin' || user?.role === 'pharmacist') && (
                              <>
                                <button
                                  onClick={() => handleEdit(medicine)}
                                  className="btn btn-sm btn-secondary"
                                  title="Edit Medicine"
                                >
                                  <Edit size={16} />
                                </button>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDelete(medicine._id)}
                                    className="btn btn-sm btn-danger"
                                    title="Delete Medicine"
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
              <Package size={64} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#64748b' }} />
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>No medicines found</h3>
              <p style={{ color: '#64748b' }}>Add your first medicine to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Medicine Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
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
                    <label className="form-label">Medicine Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Generic Name *</label>
                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName}
                      onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Manufacturer *</label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Batch Number *</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Supplier *</label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Manufacturing Date *</label>
                    <input
                      type="date"
                      name="manufacturingDate"
                      value={formData.manufacturingDate}
                      onChange={(e) => setFormData({...formData, manufacturingDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Expiry Date *</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Min Stock Level *</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cost Price (₹) *</label>
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-input"
                    rows="3"
                    placeholder="Medicine description..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Medicine Image</label>
                    <input
                      type="file"
                      name="medicineImage"
                      onChange={(e) => setFormData({...formData, medicineImage: e.target.files[0]})}
                      className="form-input"
                      accept="image/*"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="prescriptionRequired"
                        checked={formData.prescriptionRequired}
                        onChange={(e) => setFormData({...formData, prescriptionRequired: e.target.checked})}
                      />
                      Prescription Required
                    </label>
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
                    {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
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

export default Medicines;