import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import api from '@/utils/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md text-center p-8">
            <p className="text-slate-700 font-medium mb-2">Invalid reset link</p>
            <p className="text-slate-500 text-sm mb-6">
              This link is missing a token. Please request a new password reset.
            </p>
            <Link to="/forgot-password" className="text-primary hover:underline font-medium text-sm">
              Request new reset link
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Reset link is invalid or expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Set New Password
            </CardTitle>
            <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="mt-2"
                  data-testid="new-password-input"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="mt-2"
                  data-testid="confirm-password-input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full"
                data-testid="reset-submit-button"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Back to Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
