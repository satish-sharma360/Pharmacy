import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Upload,
  Save,
  Camera
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profileImage: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    if (e.target.name === 'profileImage') {
      const file = e.target.files[0];
      setFormData({ ...formData, profileImage: file });
      
      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setIsEditing(false);
      setImagePreview(null);
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        profileImage: null
      });
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImagePreview(null);
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      profileImage: null
    });
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
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
          Profile Settings
        </h2>
        <p style={{ color: '#64748b' }}>Manage your personal information and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Profile Information Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Personal Information</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary btn-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="card-body">
            {/* Profile Picture Section */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #e5e7eb'
                    }}
                  />
                ) : user?.profileImage ? (
                  <img
                    src={`http://localhost:8082/${user.profileImage}`}
                    alt="Profile"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #e5e7eb'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: '600',
                    border: '4px solid #e5e7eb'
                  }}>
                    {getUserInitials()}
                  </div>
                )}
                
                {isEditing && (
                  <label style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid white'
                  }}>
                    <Camera size={16} />
                    <input
                      type="file"
                      name="profileImage"
                      onChange={handleInputChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                  {user?.name}
                </h3>
                <p style={{ color: '#64748b', textTransform: 'capitalize' }}>
                  {user?.role} at PharmaTrust
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="form-input"
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Email cannot be changed. Contact admin if needed.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={!isEditing}
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={!isEditing}
                  rows="3"
                  required
                />
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Information</h3>
          </div>
          
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">User Role</label>
              <div style={{
                padding: '12px 16px',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textTransform: 'capitalize',
                fontWeight: '600',
                color: '#374151'
              }}>
                {user?.role}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <div>
                <span className={`badge ${user?.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Member Since</label>
              <div style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                color: '#64748b'
              }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Last Updated</label>
              <div style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                color: '#64748b'
              }}>
                {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Security Settings</h3>
        </div>
        
        <div className="card-body">
          <div className="alert alert-info">
            <strong>Password Management:</strong> Contact your system administrator to change your password or if you've forgotten it.
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              Account Security Tips
            </h4>
            <ul style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>Keep your login credentials secure and don't share them</li>
              <li>Log out from shared computers after use</li>
              <li>Report any suspicious account activity immediately</li>
              <li>Contact admin if you notice any unauthorized access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;