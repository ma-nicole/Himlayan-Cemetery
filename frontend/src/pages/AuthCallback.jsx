import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './AuthCallback.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromSocial } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      showToast(decodeURIComponent(error), 'error');
      navigate('/login');
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update auth context
        setUserFromSocial(user);
        
        showToast(`Welcome back, ${user.name}!`, 'success');
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'staff') {
          navigate('/staff/dashboard');
        } else {
          navigate('/');
        }
      } catch (e) {
        showToast('Failed to process login', 'error');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUserFromSocial, showToast]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        <div className="auth-callback-spinner"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
