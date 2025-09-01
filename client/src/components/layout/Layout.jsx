import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Package, 
  Truck, 
  Users, 
  ShoppingCart, 
  User, 
  LogOut,
  Bell,
  Search
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['admin', 'pharmacist', 'cashier']
    },
    {
      name: 'Medicines',
      href: '/medicines',
      icon: Package,
      roles: ['admin', 'pharmacist', 'cashier']
    },
    {
      name: 'Suppliers',
      href: '/suppliers',
      icon: Truck,
      roles: ['admin', 'pharmacist']
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['admin', 'pharmacist', 'cashier']
    },
    {
      name: 'Sales',
      href: '/sales',
      icon: ShoppingCart,
      roles: ['admin', 'pharmacist', 'cashier']
    }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/medicines':
        return 'Medicine Inventory';
      case '/suppliers':
        return 'Supplier Management';
      case '/customers':
        return 'Customer Management';
      case '/sales':
        return 'Sales Management';
      case '/profile':
        return 'Profile Settings';
      default:
        return 'PharmaTrust';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return 'U';
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">PharmaTrust</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Pharmacy Management
          </p>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* User info in sidebar */}
        <div style={{ 
          padding: '24px', 
          borderTop: '1px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
              {getUserInitials()}
            </div>
            <div>
              <p style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <h1 className="header-title">{getPageTitle()}</h1>
          
          <div className="header-actions">


            {/* User Menu */}
            <div className="user-menu">
              <div 
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ position: 'relative' }}
              >
                {getUserInitials()}
              </div>
              
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  minWidth: '200px',
                  zIndex: 50
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>{user?.name}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <User size={16} />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#ef4444',
                      borderTop: '1px solid #e5e7eb'
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="content">
          <Outlet />
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Layout;