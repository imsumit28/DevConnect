import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthSession } = useContext(AuthContext);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const token = searchParams.get('token');
    const _id = searchParams.get('_id') || searchParams.get('id');
    const name = searchParams.get('name');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const profilePic = searchParams.get('profilePic') || '/avatars/avatar_1.png';

    if (!token || !_id || !name || !username || !email) {
      navigate('/login?oauthError=invalid_callback', { replace: true });
      return;
    }

    try {
      setAuthSession({ token, _id, id: _id, name, username, email, profilePic });
      window.location.replace('/');
    } catch (error) {
      navigate('/login?oauthError=invalid_callback', { replace: true });
    }
  }, [navigate, searchParams, setAuthSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-gray-700">
      <p className="text-sm">Finalizing Google sign-in...</p>
    </div>
  );
};

export default OAuthCallback;
