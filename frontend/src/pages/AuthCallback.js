import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API } from "../App";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        const response = await axios.post(`${API}/auth/session`, {
          session_id: sessionId
        }, {
          withCredentials: true
        });

        const user = response.data.user;
        
        // Redirect based on role
        if (user.role === 'vendor') {
          navigate('/vendor', { state: { user }, replace: true });
        } else {
          navigate('/', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="container-mobile flex items-center justify-center">
      <div className="text-center" data-testid="auth-callback-loading">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
        <p className="mt-4 text-[#4A5D4E]">Authenticating...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
