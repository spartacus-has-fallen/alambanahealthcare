import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/utils/api';
import { setAuth } from '@/utils/auth';
import Navbar from '@/components/Navbar';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'patient',
    referralCode: searchParams.get('ref') || ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { referralCode, ...userData } = formData;
      const url = referralCode ? `/auth/register?referred_by=${referralCode}` : '/auth/register';
      const response = await api.post(url, userData);
      
      setAuth(response.data.token, response.data.user);
      toast.success('Registration successful!');
      
      // Navigate based on role
      if (formData.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md p-8" data-testid="register-form">
          <h1 className="text-3xl font-bold mb-2 text-center">Create Account</h1>
          <p className="text-slate-600 text-center mb-8">Join Alambana Healthcare today</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                data-testid="register-name-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                data-testid="register-email-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                required
                data-testid="register-phone-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                data-testid="register-password-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="role">Register as</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="mt-2" data-testid="register-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.referralCode && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                Using referral code: <strong>{formData.referralCode}</strong>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-full bg-primary hover:bg-primary/90"
              disabled={loading}
              data-testid="register-submit-button"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline" data-testid="register-login-link">
              Login here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
