import React, { useState, useEffect } from 'react';

const CaptchaWrapper = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if user was previously verified in this session
    const verified = sessionStorage.getItem('captchaVerified');
    if (verified) {
      setIsVerified(true);
      return;
    }

    // Add reCAPTCHA script if not already added
    if (!document.querySelector('script#recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setScriptLoaded(true);
      };

      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }

    // Add the callback to window object so reCAPTCHA can find it
    window.onCaptchaSuccess = () => {
      setIsVerified(true);
      sessionStorage.setItem('captchaVerified', 'true');
    };

    return () => {
      // Cleanup
      delete window.onCaptchaSuccess;
    };
  }, []);

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl text-white font-bold mb-4 text-center">Welcome to Konkt</h2>
          <p className="text-gray-300 mb-6 text-center">Please verify that you're human to continue using our service.</p>
          {scriptLoaded && (
            <div className="flex justify-center">
              <div
                className="g-recaptcha"
                data-sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                data-callback="onCaptchaSuccess"
                data-theme="dark"
              ></div>
            </div>
          )}
          {!scriptLoaded && (
            <div className="flex justify-center">
              <div className="text-gray-400">Loading verification...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default CaptchaWrapper;