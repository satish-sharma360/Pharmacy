import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  ShoppingCart,
  Calendar,
  CreditCard,
  Eye,
  Trash2,
  Receipt,
  User,
  Package
} from 'lucide-react';

const Sales = () => {
  const { user, api } = useAuth();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const [saleData, setSaleData] = useState({
    customer: '',
    items: [{ medicine: '', quantity: 1, unitPrice: 0, discount: 0 }],
    paymentMethod: 'Cash',
    paidAmount: 0,
    doctorName: '',
    notes: '',
    prescriptionImage: null
  });

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'];

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchMedicines();
  }, [searchTerm, filterPayment, pagination.currentPage]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterPayment) params.append('paymentMethod', filterPayment);

      const response = await api.get(`/sales?${params}`);
      if (response.data.success) {
        setSales(response.data.data.sales);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch sales');
      console.error('Fetch sales error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers?limit=100');
      if (response.data.success) {
        setCustomers(response.data.data.customers);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines?limit=100');
      if (response.data.success) {
        setMedicines(response.data.data.medicines.filter(med => med.quantity > 0));
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      toast.error('Failed to load medicines');
    }
  };

  const resetSaleForm = () => {
    setSaleData({
      customer: '',
      items: [{ medicine: '', quantity: 1, unitPrice: 0, discount: 0 }],
      paymentMethod: 'Cash',
      paidAmount: 0,
      doctorName: '',
      notes: '',
      prescriptionImage: null
    });
  };

  const addItem = () => {
    setSaleData(prev => ({
      ...prev,
      items: [...prev.items, { medicine: '', quantity: 1, unitPrice: 0, discount: 0 }]
    }));
  };

  const removeItem = (index) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateItemMedicine = (index, medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    if (medicine) {
      updateItem(index, 'medicine', medicineId);
      updateItem(index, 'unitPrice', medicine.sellingPrice);
    }
  };

  const calculateTotals = () => {
    const subtotal = saleData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const totalDiscount = saleData.items.reduce((sum, item) => 
      sum + (item.discount || 0), 0
    );
    const tax = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal - totalDiscount + tax;
    
    return { subtotal, totalDiscount, tax, totalAmount };
  };

  // Enhanced validation function
  const validateSaleData = () => {
    const errors = [];

    // Check if customer is selected
    if (!saleData.customer) {
      errors.push('Please select a customer');
    }

    // Validate items
    const validItems = saleData.items.filter(item => 
      item.medicine && item.quantity > 0 && item.unitPrice > 0
    );
    
    if (validItems.length === 0) {
      errors.push('Please add at least one valid item to the sale');
    }

    // Check stock availability
    for (let item of validItems) {
      const medicine = medicines.find(m => m._id === item.medicine);
      if (medicine && medicine.quantity < item.quantity) {
        errors.push(`Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Requested: ${item.quantity}`);
      }
    }

    const { totalAmount } = calculateTotals();
    
    // Check if paid amount is sufficient
    if (saleData.paidAmount < totalAmount) {
      errors.push('Paid amount cannot be less than total amount');
    }

    // Check if paid amount is valid
    if (saleData.paidAmount <= 0) {
      errors.push('Paid amount must be greater than 0');
    }

    return { errors, validItems };
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    const { errors, validItems } = validateSaleData();
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData properly
      const submitData = new FormData();
      
      // Ensure customer ID is properly sent
      submitData.append('customer', saleData.customer);
      
      // Ensure items are properly formatted
      const itemsToSubmit = validItems.map(item => ({
        medicine: item.medicine,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount) || 0
      }));
      
      submitData.append('items', JSON.stringify(itemsToSubmit));
      submitData.append('paymentMethod', saleData.paymentMethod);
      submitData.append('paidAmount', Number(saleData.paidAmount));
      submitData.append('doctorName', saleData.doctorName || '');
      submitData.append('notes', saleData.notes || '');
      
      if (saleData.prescriptionImage) {
        submitData.append('prescriptionImage', saleData.prescriptionImage);
      }

      console.log('Submitting sale data:', {
        customer: saleData.customer,
        items: itemsToSubmit,
        paymentMethod: saleData.paymentMethod,
        paidAmount: saleData.paidAmount,
        doctorName: saleData.doctorName,
        notes: saleData.notes
      });

      const response = await api.post('/sales', submitData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 seconds timeout
      });

      if (response.data.success) {
        toast.success('Sale completed successfully!');
        setShowModal(false);
        resetSaleForm();
        fetchSales();
      } else {
        toast.error(response.data.message || 'Sale failed');
      }
    } catch (error) {
      console.error('Sale submission error:', error);
      
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            `Server error: ${error.response.status}`;
        toast.error(errorMessage);
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error - please check your connection');
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        toast.error('An unexpected error occurred');
        console.error('Unexpected error:', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { subtotal, totalDiscount, tax, totalAmount } = calculateTotals();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Sales Management
          </h2>
          <p style={{ color: '#64748b' }}>Process sales and manage transactions</p>
        </div>
        
        <button
          onClick={() => {
            resetSaleForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={20} />
          New Sale
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
                placeholder="Search by invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="form-select"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Payment Methods</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
              <p>Loading sales...</p>
            </div>
          ) : sales.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Sold By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale._id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                            {sale.invoiceNumber}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600' }}>
                              {sale.customer?.name || 'Walk-in Customer'}
                            </div>
                            {sale.customer?.phone && (
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {sale.customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px' }}>
                            <div style={{ fontWeight: '600' }}>
                              {sale.items?.length || 0} item(s)
                            </div>
                            {sale.items?.[0]?.medicine?.name && (
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {sale.items[0].medicine.name}
                                {sale.items.length > 1 && ` +${sale.items.length - 1} more`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#10b981' }}>
                            {formatCurrency(sale.totalAmount)}
                          </div>
                          {sale.totalDiscount > 0 && (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Discount: {formatCurrency(sale.totalDiscount)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-info">{sale.paymentMethod}</span>
                        </td>
                        <td style={{ fontSize: '14px' }}>
                          {formatDate(sale.saleDate)}
                        </td>
                        <td>{sale.soldBy?.name}</td>
                        <td>
                          <span className={`badge ${
                            sale.paymentStatus === 'Paid' ? 'badge-success' :
                            sale.paymentStatus === 'Pending' ? 'badge-warning' :
                            sale.paymentStatus === 'Partial' ? 'badge-info' :
                            'badge-danger'
                          }`}>
                            {sale.paymentStatus}
                          </span>
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
              <ShoppingCart size={64} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#64748b' }} />
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>No sales found</h3>
              <p style={{ color: '#64748b' }}>Create your first sale to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* New Sale Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">New Sale</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetSaleForm();
                }}
                className="modal-close"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmitSale}>
                {/* Customer Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Customer *
                  </label>
                  <select
                    value={saleData.customer}
                    onChange={(e) => setSaleData(prev => ({ ...prev, customer: e.target.value }))}
                    className="form-select"
                    required
                    disabled={submitting}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                  {customers.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      No customers available. Please add customers first.
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ color: '#374151' }}>
                      <Package size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      Sale Items
                    </h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-sm btn-secondary"
                      disabled={submitting}
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>

                  {saleData.items.map((item, index) => {
                    const selectedMedicine = medicines.find(m => m._id === item.medicine);
                    return (
                      <div key={index} style={{ 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '16px',
                        background: '#f8fafc'
                      }}>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Medicine *</label>
                            <select
                              value={item.medicine}
                              onChange={(e) => updateItemMedicine(index, e.target.value)}
                              className="form-select"
                              required
                              disabled={submitting}
                            >
                              <option value="">Select Medicine</option>
                              {medicines.map(medicine => (
                                <option key={medicine._id} value={medicine._id}>
                                  {medicine.name} - Stock: {medicine.quantity} - {formatCurrency(medicine.sellingPrice)}
                                </option>
                              ))}
                            </select>
                            {medicines.length === 0 && (
                              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                                No medicines available in stock
                              </div>
                            )}
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Quantity *</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="form-input"
                              min="1"
                              max={selectedMedicine ? selectedMedicine.quantity : 999}
                              required
                              disabled={submitting}
                            />
                            {selectedMedicine && item.quantity > selectedMedicine.quantity && (
                              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                                Only {selectedMedicine.quantity} available in stock
                              </div>
                            )}
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Unit Price *</label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="form-input"
                              min="0"
                              step="0.01"
                              required
                              disabled={submitting}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Discount</label>
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="form-input"
                              min="0"
                              step="0.01"
                              disabled={submitting}
                            />
                          </div>
                          
                          {saleData.items.length > 1 && (
                            <div className="form-group">
                              <label className="form-label" style={{ opacity: 0 }}>Remove</label>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="btn btn-danger btn-sm"
                                style={{ width: '100%' }}
                                disabled={submitting}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div style={{ marginTop: '12px', padding: '8px', background: 'white', borderRadius: '4px' }}>
                          <strong>Item Total: {formatCurrency((item.quantity * item.unitPrice) - (item.discount || 0))}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sale Totals */}
                <div style={{ 
                  background: '#f1f5f9', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '24px' 
                }}>
                  <h4 style={{ marginBottom: '12px', color: '#374151' }}>Sale Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>Subtotal: <strong>{formatCurrency(subtotal)}</strong></div>
                    <div>Discount: <strong>{formatCurrency(totalDiscount)}</strong></div>
                    <div>Tax (18%): <strong>{formatCurrency(tax)}</strong></div>
                    <div style={{ fontSize: '18px', color: '#10b981' }}>
                      Total: <strong>{formatCurrency(totalAmount)}</strong>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <CreditCard size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      Payment Method *
                    </label>
                    <select
                      value={saleData.paymentMethod}
                      onChange={(e) => setSaleData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="form-select"
                      required
                      disabled={submitting}
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Paid Amount *</label>
                    <input
                      type="number"
                      value={saleData.paidAmount}
                      onChange={(e) => setSaleData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                      disabled={submitting}
                    />
                    {saleData.paidAmount > totalAmount && (
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                        Change: {formatCurrency(saleData.paidAmount - totalAmount)}
                      </div>
                    )}
                    {saleData.paidAmount > 0 && saleData.paidAmount < totalAmount && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                        Insufficient amount. Required: {formatCurrency(totalAmount)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Doctor Name</label>
                    <input
                      type="text"
                      value={saleData.doctorName}
                      onChange={(e) => setSaleData(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="form-input"
                      placeholder="Prescribing doctor name"
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Prescription Image</label>
                    <input
                      type="file"
                      onChange={(e) => setSaleData(prev => ({ ...prev, prescriptionImage: e.target.files[0] }))}
                      className="form-input"
                      accept="image/*"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={saleData.notes}
                    onChange={(e) => setSaleData(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-input"
                    rows="3"
                    placeholder="Additional notes for this sale..."
                    disabled={submitting}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetSaleForm();
                    }}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={submitting || totalAmount <= 0}
                  >
                    {submitting ? (
                      <>
                        <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Receipt size={16} />
                        Complete Sale
                      </>
                    )}
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

export default Sales;