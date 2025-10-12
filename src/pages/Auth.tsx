import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Sprout, Phone, Lock, User, ArrowLeft, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Auth = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    fullName: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [language, setLanguage] = useState('en');

  const { signInWithPhone, signUpWithPhone, sendOTP, verifyOTP, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (authMode === 'signup' && !formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (loginMethod === 'password' && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (loginMethod === 'password' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (loginMethod === 'otp' && otpSent && !formData.otp) {
      newErrors.otp = 'OTP is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validatePhone(formData.phone)) {
      setErrors({ phone: 'Enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    const { error } = await sendOTP(formData.phone);
    setLoading(false);

    if (!error) {
      setOtpSent(true);
      setResendTimer(60);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (loginMethod === 'otp' && otpSent) {
        const { error } = await verifyOTP(formData.phone, formData.otp);
        if (!error) {
          // Success handled by AuthContext
        }
      } else if (authMode === 'login') {
        const { error } = await signInWithPhone(formData.phone, formData.password);
      } else {
        const { error } = await signUpWithPhone(formData.phone, formData.password, formData.fullName);
        if (!error) {
          setAuthMode('login');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी' },
    { value: 'mr', label: 'मराठी' },
    { value: 'pa', label: 'ਪੰਜਾਬੀ' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[140px] bg-white border-primary/20">
            <Globe className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full max-w-md shadow-large border-primary/10">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <Sprout className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary">KrishiMarg</h1>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-semibold">
              {authMode === 'login' ? 'Welcome Back, Farmer!' : 'Join KrishiMarg'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Login easily with your phone number or Google account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Toggle between Login and Signup */}
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
            <Button
              type="button"
              variant={authMode === 'login' ? 'default' : 'ghost'}
              className={`flex-1 ${authMode === 'login' ? 'bg-primary text-white shadow-md' : 'text-foreground'}`}
              onClick={() => {
                setAuthMode('login');
                setOtpSent(false);
                setErrors({});
              }}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={authMode === 'signup' ? 'default' : 'ghost'}
              className={`flex-1 ${authMode === 'signup' ? 'bg-primary text-white shadow-md' : 'text-foreground'}`}
              onClick={() => {
                setAuthMode('signup');
                setLoginMethod('password');
                setOtpSent(false);
                setErrors({});
              }}
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Only for Signup */}
            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`h-11 rounded-lg border-2 focus:border-primary ${errors.fullName ? 'border-destructive' : 'border-border'}`}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                Phone Number
              </Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 h-11 bg-muted rounded-lg border-2 border-border">
                  <span className="text-sm font-medium">+91</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`h-11 flex-1 rounded-lg border-2 focus:border-primary ${errors.phone ? 'border-destructive' : 'border-border'}`}
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Login Method Toggle - Only for Login */}
            {authMode === 'login' && (
              <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`flex-1 ${loginMethod === 'password' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => {
                    setLoginMethod('password');
                    setOtpSent(false);
                  }}
                >
                  Password
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`flex-1 ${loginMethod === 'otp' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setLoginMethod('otp')}
                >
                  OTP
                </Button>
              </div>
            )}

            {/* Password Field */}
            {(loginMethod === 'password' || authMode === 'signup') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`h-11 rounded-lg border-2 focus:border-primary ${errors.password ? 'border-destructive' : 'border-border'}`}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {/* OTP Section */}
            {loginMethod === 'otp' && authMode === 'login' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || !validatePhone(formData.phone)}
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-md"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-foreground">
                        Enter OTP
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`h-11 rounded-lg border-2 focus:border-primary text-center text-lg tracking-widest ${errors.otp ? 'border-destructive' : 'border-border'}`}
                        maxLength={6}
                      />
                      {errors.otp && (
                        <p className="text-sm text-destructive">{errors.otp}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Didn't receive OTP?
                      </span>
                      {resendTimer > 0 ? (
                        <span className="text-primary font-medium">
                          Resend in {resendTimer}s
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleSendOTP}
                          disabled={loading}
                          className="h-auto p-0 text-primary font-medium"
                        >
                          Resend OTP
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            {(loginMethod === 'password' || authMode === 'signup' || otpSent) && (
              <Button 
                type="submit" 
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white text-base font-semibold shadow-md hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
              </Button>
            )}
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-foreground font-medium">Sign in with Google</span>
          </Button>

          {/* Toggle Auth Mode Text */}
          <p className="text-center text-sm text-muted-foreground">
            {authMode === 'login' ? (
              <>
                New user?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrors({});
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrors({});
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
