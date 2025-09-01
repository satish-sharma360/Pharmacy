import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Package, 
  Users, 
  Truck, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const { user, api } = useAuth();
  const [stats, setStats] = useState({
    medicines: 0,
    customers: 0,
    suppliers: 0,
    todaySales: 0,
    lowStockCount: 0,
    expiredCount: 0,
    totalRevenue: 0,
    totalSales: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data
      const promises = [
        api.get('/medicines'),
        api.get('/customers'),
        api.get('/suppliers'),
        api.get('/sales?limit=5'),
        api.get('/medicines/low-stock'),
        api.get('/medicines/expired'),
        api.get('/sales/analytics?period=month')
      ];

      const [
        medicinesRes,
        customersRes,
        suppliersRes,
        salesRes,
        lowStockRes,
        expiredRes,
        analyticsRes
      ] = await Promise.all(promises);

      // Calculate stats
      const medicines = medicinesRes.data.data.medicines || [];
      const customers = customersRes.data.data.customers || [];
      const suppliers = suppliersRes.data.data.suppliers || [];
      const sales = salesRes.data.data.sales || [];
      const lowStock = lowStockRes.data.data.medicines || [];
      const expired = expiredRes.data.data.medicines || [];
      const analytics = analyticsRes.data.data.overview || {};

      setStats({
        medicines: medicines.length,
        customers: customers.length,
        suppliers: suppliers.length,
        todaySales: sales.length,
        lowStockCount: lowStock.length,
        expiredCount: expired.length,
        totalRevenue: analytics.totalRevenue || 0,
        totalSales: analytics.totalSales || 0
      });

      setRecentSales(sales);
      setLowStockMedicines(lowStock.slice(0, 5));

      // Mock sales trend data for chart
      const mockSalesData = [
        { name: 'Mon', sales: 4000, revenue: 24000 },
        { name: 'Tue', sales: 3000, revenue: 18000 },
        { name: 'Wed', sales: 5000, revenue: 30000 },
        { name: 'Thu', sales: 2780, revenue: 16680 },
        { name: 'Fri', sales: 6890, revenue: 41340 },
        { name: 'Sat', sales: 3490, revenue: 20940 },
        { name: 'Sun', sales: 4300, revenue: 25800 }
      ];
      setSalesData(mockSalesData);

    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Message */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
          Welcome back, {user?.name}! 👋
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Here's what's happening at your pharmacy today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <span className="stat-title">Total Medicines</span>
            <Package className="stat-icon" />
          </div>
          <div className="stat-value">{stats.medicines}</div>
          <div className="stat-description">Active in inventory</div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <span className="stat-title">Total Customers</span>
            <Users className="stat-icon" />
          </div>
          <div className="stat-value">{stats.customers}</div>
          <div className="stat-description">Registered customers</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <span className="stat-title">Total Suppliers</span>
            <Truck className="stat-icon" />
          </div>
          <div className="stat-value">{stats.suppliers}</div>
          <div className="stat-description">Active suppliers</div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <span className="stat-title">Monthly Revenue</span>
            <IndianRupee className="stat-icon" />
          </div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-description">{stats.totalSales} sales this month</div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.lowStockCount > 0 || stats.expiredCount > 0) && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={20} style={{ marginRight: '8px', color: '#f59e0b' }} />
              Inventory Alerts
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {stats.lowStockCount > 0 && (
                <div className="alert alert-warning">
                  <strong>{stats.lowStockCount} medicines</strong> are running low on stock
                </div>
              )}
              {stats.expiredCount > 0 && (
                <div className="alert alert-error">
                  <strong>{stats.expiredCount} medicines</strong> have expired
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Sales Trend Chart */}
        

        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShoppingCart size={20} style={{ marginRight: '8px' }} />
              Recent Sales
            </h3>
          </div>
          <div className="card-body">
            {recentSales.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale._id}>
                        <td style={{ fontWeight: '600', fontSize: '14px' }}>
                          {sale.invoiceNumber}
                        </td>
                        <td>{sale.customer?.name || 'Walk-in'}</td>
                        <td style={{ fontWeight: '600', color: '#10b981' }}>
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td style={{ fontSize: '14px', color: '#64748b' }}>
                          {formatDate(sale.saleDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '32px' }}>
                <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>No recent sales found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Medicines */}
      {lowStockMedicines.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={20} style={{ marginRight: '8px', color: '#f59e0b' }} />
              Low Stock Medicines
            </h3>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Current Stock</th>
                    <th>Min Level</th>
                    <th>Status</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockMedicines.map((medicine) => (
                    <tr key={medicine._id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600' }}>{medicine.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {medicine.genericName}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: '#ef4444' }}>
                        {medicine.quantity}
                      </td>
                      <td>{medicine.minStockLevel}</td>
                      <td>
                        <span className="badge badge-warning">Low Stock</span>
                      </td>
                      <td style={{ fontSize: '14px' }}>
                        {formatDate(medicine.expiryDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;