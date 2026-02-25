import React, { useState, useEffect, useRef } from 'react';
import plotService from '../../services/plotService';
import { getInvitationStatus } from '../../services/invitationService';
import userService from '../../services/userService';

const BurialForm = ({ burial, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    plot_id: '',
    // Deceased Information
    deceased_first_name: '',
    deceased_middle_initial: '',
    deceased_last_name: '',
    deceased_nickname: '',
    deceased_photo: null,
    deceased_gender: '',
    is_publicly_searchable: true,
    birth_date: '',
    death_date: '',
    burial_date: '',
    obituary: '',
    notes: '',
    // Primary Contact Information
    contact_first_name: '',
    contact_middle_initial: '',
    contact_last_name: '',
    contact_country_code: '+63',
    contact_phone: '',
    contact_email: '',
    // Secondary Contact Information (Optional)
    contact2_first_name: '',
    contact2_middle_initial: '',
    contact2_last_name: '',
    contact2_country_code: '+63',
    contact2_phone: '',
    contact2_email: '',
  });
  const [availablePlots, setAvailablePlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState(null);
  const formLoadedRef = useRef(false); // Track if form was just populated from edit

  // Load available plots
  useEffect(() => {
    const loadPlots = async () => {
      try {
        const response = await plotService.getAvailable();
        if (response.success) {
          setAvailablePlots(response.data);
        }
      } catch (err) {
        console.error('Failed to load plots:', err);
      }
    };
    loadPlots();
  }, []);

  // Fetch invitation status when editing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (burial && burial.id) {
      const fetchStatus = async () => {
        try {
          const status = await getInvitationStatus(burial.id);
          setInvitationStatus(status);
        } catch (err) {
          console.error('Failed to fetch invitation status:', err);
        }
      };
      fetchStatus();
    }
  }, [burial?.id]);

  // Auto-fill contact names when email matches an activated account
  useEffect(() => {
    const autoFillNames = async () => {
      const email = formData.contact_email.trim();
      
      // Only auto-fill if:
      // 1. Email is valid
      // 2. Form was not just loaded (this prevents overwriting existing contact info when editing)
      // 3. Account is not already activated (email locked)
      if (email && email.includes('@') && !formLoadedRef.current && invitationStatus?.status !== 'accepted') {
        try {
          const user = await userService.getUserByEmail(email);
          if (user && user.name) {
            const { firstName, middleInitial, lastName } = userService.parseName(user.name);
            setFormData(prev => ({
              ...prev,
              contact_first_name: firstName,
              contact_middle_initial: middleInitial,
              contact_last_name: lastName,
            }));
          }
        } catch (err) {
          // Silently fail if user not found
          console.debug('User not found for auto-fill:', email);
        }
      }
      
      // Reset the ref after first auto-fill check so that manual changes trigger subsequent auto-fills
      if (formLoadedRef.current && !email) {
        formLoadedRef.current = false;
      }
    };

    // Debounce the auto-fill to avoid excessive API calls
    const timer = setTimeout(autoFillNames, 500);
    return () => clearTimeout(timer);
  }, [formData.contact_email, invitationStatus?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form when editing
  useEffect(() => {
    if (burial) {
      // Parse deceased name if it exists (backward compatibility)
      const nameParts = burial.deceased_name ? burial.deceased_name.split(' ') : ['', '', ''];
      
      setFormData({
        plot_id: burial.plot_id || '',
        deceased_first_name: burial.deceased_first_name || nameParts[0] || '',
        deceased_middle_initial: burial.deceased_middle_initial || nameParts[1]?.[0] || '',
        deceased_last_name: burial.deceased_last_name || nameParts[nameParts.length - 1] || '',
        deceased_nickname: burial.deceased_nickname || '',
        deceased_photo: null,
        deceased_gender: burial.deceased_gender || '',
        is_publicly_searchable: burial.is_publicly_searchable !== undefined ? burial.is_publicly_searchable : true,
        birth_date: burial.birth_date?.split('T')[0] || '',
        death_date: burial.death_date?.split('T')[0] || '',
        burial_date: burial.burial_date?.split('T')[0] || '',
        obituary: burial.obituary || '',
        notes: burial.notes || '',
        // Parse contact name if it exists (backward compatibility)
        contact_first_name: burial.contact_first_name || burial.contact_name?.split(' ')[0] || '',
        contact_middle_initial: burial.contact_middle_initial || '',
        contact_last_name: burial.contact_last_name || '',
        contact_country_code: burial.contact_country_code || '+63',
        contact_phone: burial.contact_phone || '',
        contact_email: burial.contact_email || '',
        contact2_first_name: burial.contact2_first_name || '',
        contact2_middle_initial: burial.contact2_middle_initial || '',
        contact2_last_name: burial.contact2_last_name || '',
        contact2_country_code: burial.contact2_country_code || '+63',
        contact2_phone: burial.contact2_phone || '',
        contact2_email: burial.contact2_email || '',
      });

      // Mark that form was just loaded from burial record to prevent auto-fill override
      formLoadedRef.current = true;

      // Set photo preview if exists
      if (burial.deceased_photo_url) {
        setPhotoPreview(burial.deceased_photo_url);
      }
    }
  }, [burial]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // When user manually changes contact email, reset the form loaded flag
    // to allow auto-fill on new email entry
    if (name === 'contact_email') {
      formLoadedRef.current = false;
    }
    
    // Handle country code changes - clear phone if it exceeds new country's limit
    if (name === 'contact_country_code' || name === 'contact2_country_code') {
      const phoneField = name === 'contact_country_code' ? 'contact_phone' : 'contact2_phone';
      const currentPhone = formData[phoneField];
      const newMaxLength = getPhoneRequirements(value).digits;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        // Clear phone if it exceeds new country's length requirement
        [phoneField]: currentPhone.length > newMaxLength ? '' : currentPhone
      }));
      return;
    }
    
    // Handle phone number input - only allow digits and enforce length limit
    if (name === 'contact_phone' || name === 'contact2_phone') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove non-digit characters
      const countryCode = name === 'contact_phone' ? formData.contact_country_code : formData.contact2_country_code;
      const maxLength = getPhoneRequirements(countryCode).digits;
      
      // Only update if within length limit
      if (digitsOnly.length <= maxLength) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: digitsOnly 
        }));
      }
      return;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload only JPG or PNG images');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should not exceed 5MB');
        e.target.value = '';
        return;
      }

      setFormData(prev => ({ ...prev, deceased_photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const getPhoneRequirements = (countryCode) => {
    const requirements = {
      '+63': { digits: 10, country: 'Philippines' },
      '+1': { digits: 10, country: 'USA/Canada' },
      '+44': { digits: 10, country: 'UK' },
      '+61': { digits: 9, country: 'Australia' },
      '+81': { digits: 10, country: 'Japan' },
      '+82': { digits: 10, country: 'South Korea' },
      '+86': { digits: 11, country: 'China' },
      '+65': { digits: 8, country: 'Singapore' },
      '+60': { digits: 10, country: 'Malaysia' },
      '+971': { digits: 9, country: 'UAE' }
    };
    return requirements[countryCode] || { digits: 10, country: 'Selected Country' };
  };

  const capitalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    
    // Trim and convert to lowercase first
    name = name.trim().toLowerCase();
    
    // Split by spaces to handle multi-word names
    const words = name.split(' ');
    
    // Special prefixes that should be lowercase (common in Filipino/Spanish names)
    const lowercasePrefixes = ['de', 'del', 'dela', 'delos', 'las', 'los', 'san', 'santa', 'von', 'van', 'der'];
    
    const capitalizedWords = words.map((word, index) => {
      if (!word) return '';
      
      // If it's not the first word and it's a prefix, keep it lowercase
      if (index > 0 && lowercasePrefixes.includes(word)) {
        return word;
      }
      
      // Otherwise, capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    
    return capitalizedWords.join(' ');
  };

  const capitalizeMiddleInitial = (initial) => {
    if (!initial || typeof initial !== 'string') return '';
    return initial.trim().toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // HTML5 validation will handle all field validations

    setLoading(true);

    try {
      // Capitalize all name fields before submission
      const capitalizedData = {
        ...formData,
        deceased_first_name: capitalizeName(formData.deceased_first_name),
        deceased_middle_initial: capitalizeMiddleInitial(formData.deceased_middle_initial),
        deceased_last_name: capitalizeName(formData.deceased_last_name),
        deceased_nickname: capitalizeName(formData.deceased_nickname),
        contact_first_name: capitalizeName(formData.contact_first_name),
        contact_middle_initial: capitalizeMiddleInitial(formData.contact_middle_initial),
        contact_last_name: capitalizeName(formData.contact_last_name),
        contact2_first_name: capitalizeName(formData.contact2_first_name),
        contact2_middle_initial: capitalizeMiddleInitial(formData.contact2_middle_initial),
        contact2_last_name: capitalizeName(formData.contact2_last_name),
      };

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append all form fields with capitalized names
      Object.keys(capitalizedData).forEach(key => {
        if (key === 'deceased_photo' && capitalizedData[key]) {
          submitData.append(key, capitalizedData[key]);
        } else if (key === 'is_publicly_searchable') {
          // Convert boolean to 1 or 0 for Laravel
          submitData.append(key, capitalizedData[key] ? 1 : 0);
        } else if (key !== 'deceased_photo') {
          submitData.append(key, capitalizedData[key]);
        }
      });

      // Also include full deceased name for backward compatibility
      const fullDeceasedName = `${capitalizedData.deceased_first_name} ${capitalizedData.deceased_middle_initial ? capitalizedData.deceased_middle_initial + '.' : ''} ${capitalizedData.deceased_last_name}`.trim();
      submitData.append('deceased_name', fullDeceasedName);

      // Include full contact name for backward compatibility
      if (capitalizedData.contact_first_name || capitalizedData.contact_last_name) {
        const fullContactName = `${capitalizedData.contact_first_name} ${capitalizedData.contact_middle_initial ? capitalizedData.contact_middle_initial + '.' : ''} ${capitalizedData.contact_last_name}`.trim();
        submitData.append('contact_name', fullContactName);
      }

      await onSubmit(submitData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save burial record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 5px' }}>
      {error && <div className="alert alert-error">{error}</div>}
      
      {/* Plot Selection */}
      <div className="form-group">
        <label>Plot *</label>
        <select
          name="plot_id"
          className="form-control"
          value={formData.plot_id}
          onChange={handleChange}
          required
          disabled={!!burial}
        >
          <option value="">Select a plot</option>
          {burial?.plot && (
            <option value={burial.plot_id}>
              {burial.plot.plot_number} - Section {burial.plot.section}
            </option>
          )}
          {availablePlots.map(plot => (
            <option key={plot.id} value={plot.id}>
              {plot.plot_number} - Section {plot.section}
            </option>
          ))}
        </select>
      </div>

      <h4 style={{ marginTop: '20px', marginBottom: '15px', color: '#1a1a2e' }}>Deceased Information</h4>

      {/* Deceased Name Fields */}
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="deceased_first_name"
            className="form-control"
            value={formData.deceased_first_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 120px' }}>
          <label>M.I.</label>
          <input
            type="text"
            name="deceased_middle_initial"
            className="form-control"
            value={formData.deceased_middle_initial}
            onChange={handleChange}
            maxLength="2"
            placeholder="A"
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="deceased_last_name"
            className="form-control"
            value={formData.deceased_last_name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Nickname and Gender */}
      <div className="form-row">
        <div className="form-group">
          <label>Nickname</label>
          <input
            type="text"
            name="deceased_nickname"
            className="form-control"
            value={formData.deceased_nickname}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
        <div className="form-group">
          <label>Gender *</label>
          <select
            name="deceased_gender"
            className="form-control"
            value={formData.deceased_gender}
            onChange={handleChange}
            required
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="form-group">
        <label>Photo (JPG, PNG only)</label>
        <input
          type="file"
          name="deceased_photo"
          className="form-control"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
        {photoPreview && (
          <div style={{ marginTop: '10px' }}>
            <img 
              src={photoPreview} 
              alt="Preview" 
              style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} 
            />
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="form-row">
        <div className="form-group">
          <label>Birth Date *</label>
          <input
            type="date"
            name="birth_date"
            className="form-control"
            value={formData.birth_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Death Date *</label>
          <input
            type="date"
            name="death_date"
            className="form-control"
            value={formData.death_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Burial Date *</label>
        <input
          type="date"
          name="burial_date"
          className="form-control"
          value={formData.burial_date}
          onChange={handleChange}
          required
        />
      </div>

      {/* Public Searchability Checkbox */}
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="is_publicly_searchable"
            checked={formData.is_publicly_searchable}
            onChange={handleChange}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          <span>Allow this record to be searchable on public "Find a Grave"</span>
        </label>
        <small style={{ color: '#666', marginLeft: '24px', display: 'block' }}>
          If unchecked, this burial record will not appear in public search results
        </small>
      </div>

      {/* Obituary */}
      <div className="form-group">
        <label>Obituary</label>
        <textarea
          name="obituary"
          className="form-control"
          value={formData.obituary}
          onChange={handleChange}
          rows="4"
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          className="form-control"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
        />
      </div>

      {/* Primary Contact Information */}
      <h4 style={{ marginTop: '20px', marginBottom: '15px', color: '#1a1a2e' }}>Primary Contact Information</h4>

      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="contact_first_name"
            className="form-control"
            value={formData.contact_first_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 120px' }}>
          <label>M.I.</label>
          <input
            type="text"
            name="contact_middle_initial"
            className="form-control"
            value={formData.contact_middle_initial}
            onChange={handleChange}
            maxLength="2"
            placeholder="A"
          />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="contact_last_name"
            className="form-control"
            value={formData.contact_last_name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Contact Phone *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              name="contact_country_code"
              className="form-control"
              value={formData.contact_country_code}
              onChange={handleChange}
              style={{ flex: '0 0 100px' }}
              required
            >
              <option value="+63">🇵🇭 +63</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+81">🇯🇵 +81</option>
              <option value="+82">🇰🇷 +82</option>
              <option value="+86">🇨🇳 +86</option>
              <option value="+65">🇸🇬 +65</option>
              <option value="+60">🇲🇾 +60</option>
              <option value="+971">🇦🇪 +971</option>
            </select>
            <input
              type="tel"
              name="contact_phone"
              className="form-control"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="9123456789"
              style={{ flex: '1' }}
              pattern={`\\d{${getPhoneRequirements(formData.contact_country_code).digits}}`}
              title={`Please enter exactly ${getPhoneRequirements(formData.contact_country_code).digits} digits for ${getPhoneRequirements(formData.contact_country_code).country}`}
              required
            />
          </div>
          <small style={{ color: '#666' }}>Enter exactly {getPhoneRequirements(formData.contact_country_code).digits} digits for {getPhoneRequirements(formData.contact_country_code).country}</small>
        </div>
        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            name="contact_email"
            className="form-control"
            value={formData.contact_email}
            onChange={handleChange}
            placeholder="email@example.com"
            disabled={invitationStatus?.status === 'accepted'}
            title={invitationStatus?.status === 'accepted' ? 'Email cannot be changed after account activation' : ''}
            required
          />
          {invitationStatus?.status === 'accepted' && (
            <small style={{ color: '#d97706', marginTop: '5px', display: 'block' }}>
              Email cannot be edited after account activation
            </small>
          )}
        </div>
      </div>

      {/* Secondary Contact Information (Optional) */}
      <h4 style={{ marginTop: '20px', marginBottom: '15px', color: '#1a1a2e' }}>
        Secondary Contact Information <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#666' }}>(Optional)</span>
      </h4>

      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="contact2_first_name"
            className="form-control"
            value={formData.contact2_first_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 120px' }}>
          <label>M.I.</label>
          <input
            type="text"
            name="contact2_middle_initial"
            className="form-control"
            value={formData.contact2_middle_initial}
            onChange={handleChange}
            maxLength="2"
            placeholder="A"
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            name="contact2_last_name"
            className="form-control"
            value={formData.contact2_last_name}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Contact Phone</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              name="contact2_country_code"
              className="form-control"
              value={formData.contact2_country_code}
              onChange={handleChange}
              style={{ flex: '0 0 100px' }}
            >
              <option value="+63">🇵🇭 +63</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+81">🇯🇵 +81</option>
              <option value="+82">🇰🇷 +82</option>
              <option value="+86">🇨🇳 +86</option>
              <option value="+65">🇸🇬 +65</option>
              <option value="+60">🇲🇾 +60</option>
              <option value="+971">🇦🇪 +971</option>
            </select>
            <input
              type="tel"
              name="contact2_phone"
              className="form-control"
              value={formData.contact2_phone}
              onChange={handleChange}
              placeholder="9123456789"
              style={{ flex: '1' }}
              pattern={`\\d{${getPhoneRequirements(formData.contact2_country_code).digits}}`}
              title={`Please enter exactly ${getPhoneRequirements(formData.contact2_country_code).digits} digits for ${getPhoneRequirements(formData.contact2_country_code).country}`}
            />
          </div>
          <small style={{ color: '#666' }}>Enter exactly {getPhoneRequirements(formData.contact2_country_code).digits} digits for {getPhoneRequirements(formData.contact2_country_code).country}</small>
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            name="contact2_email"
            className="form-control"
            value={formData.contact2_email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div className="modal-footer" style={{ padding: '20px 0 0 0', borderTop: 'none', marginTop: '20px' }}>
        <button type="button" className="btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (burial ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default BurialForm;
