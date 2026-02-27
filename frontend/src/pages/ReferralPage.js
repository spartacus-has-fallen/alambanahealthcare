import React, { useEffect, useState } from 'react';
import { Gift, Share2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const ReferralPage = () => {
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await api.get('/referral/stats');
      setReferralData(response.data);
    } catch (error) {
      toast.error('Failed to load referral data');
    }
  };

  const referralLink = referralData ? 
    `${window.location.origin}/register?ref=${referralData.referral_code}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const message = `Join Alambana Healthcare using my referral code and get started with verified doctors and AI health assessment! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12" data-testid="referral-page">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
          <p className="text-slate-600 text-lg">Invite friends and earn rewards together</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-600">{referralData?.total_points || 0}</div>
              <p className="text-sm text-slate-500 mt-2">Redeemable for discounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-600">{referralData?.total_referrals || 0}</div>
              <p className="text-sm text-slate-500 mt-2">Friends you've invited</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg text-center border-2 border-amber-200">
              <p className="text-sm text-slate-600 mb-2">Your Code</p>
              <p className="text-4xl font-bold text-amber-600 tracking-wider" data-testid="referral-code">
                {referralData?.referral_code}
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-600 mb-2 block">Referral Link</label>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1"
                  data-testid="referral-link-input"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="gap-2"
                  data-testid="copy-link-button"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleWhatsAppShare}
              className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              data-testid="whatsapp-share-button"
            >
              <Share2 className="h-4 w-4" />
              Share via WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Share Your Code</h4>
                  <p className="text-sm text-slate-600">Send your referral code or link to friends and family</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">They Sign Up</h4>
                  <p className="text-sm text-slate-600">When they register using your code, both earn points</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Earn Rewards</h4>
                  <p className="text-sm text-slate-600">Redeem points for discounts on consultations and services</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700 text-center">
                <strong>Current Reward:</strong> Earn 10 points for each successful referral!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default ReferralPage;
