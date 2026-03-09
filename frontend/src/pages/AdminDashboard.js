import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, Calendar, DollarSign, CheckCircle, X, Settings, TrendingUp, Bot, Megaphone, Gift, Trash2, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const RISK_COLORS = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444', emergency: '#DC2626' };

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [platformConfig, setPlatformConfig] = useState({ commission_percentage: 15, referral_points_per_signup: 10 });
  const [editCommission, setEditCommission] = useState('');
  const [editReferralPts, setEditReferralPts] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [aiMonitor, setAiMonitor] = useState(null);
  const [ads, setAds] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [adForm, setAdForm] = useState({ title: '', link_url: '', position: 'top', image_base64: '', start_date: '', end_date: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAdminData();
    fetchPlatformConfig();
    fetchRevenue();
    fetchAiMonitor();
    fetchAds();
    fetchReferralStats();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, doctorsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/doctors/pending')
      ]);
      setAnalytics(analyticsRes.data);
      setPendingDoctors(doctorsRes.data);
    } catch {
      toast.error('Failed to load admin data');
    }
  };

  const fetchPlatformConfig = async () => {
    try {
      const res = await api.get('/admin/platform-config');
      setPlatformConfig(res.data);
      setEditCommission(String(res.data.commission_percentage));
      setEditReferralPts(String(res.data.referral_points_per_signup));
    } catch {}
  };

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/admin/revenue');
      setRevenue(res.data);
    } catch {}
  };

  const fetchAiMonitor = async () => {
    try {
      const res = await api.get('/admin/ai-monitoring');
      setAiMonitor(res.data);
    } catch {}
  };

  const fetchAds = async () => {
    try {
      const res = await api.get('/admin/advertisements');
      setAds(res.data);
    } catch {}
  };

  const fetchReferralStats = async () => {
    try {
      const res = await api.get('/admin/referral/stats');
      setReferralStats(res.data);
    } catch {}
  };

  const handleDoctorApproval = async (doctorId, approved) => {
    try {
      await api.put(`/admin/doctors/${doctorId}/approve?approved=${approved}`);
      toast.success(`Doctor ${approved ? 'approved' : 'rejected'} successfully`);
      fetchAdminData();
    } catch {
      toast.error('Failed to update doctor status');
    }
  };

  const savePlatformConfig = async () => {
    try {
      await api.put('/admin/platform-config', {
        commission_percentage: parseFloat(editCommission),
        referral_points_per_signup: parseInt(editReferralPts)
      });
      toast.success('Platform config saved');
      fetchPlatformConfig();
      fetchReferralStats();
    } catch {
      toast.error('Failed to save config');
    }
  };

  const handleAdImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error('Image must be under 800KB. Please compress it first.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAdForm(f => ({ ...f, image_base64: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const submitAd = async () => {
    if (!adForm.title || !adForm.link_url || !adForm.image_base64) {
      toast.error('Title, link, and image are required');
      return;
    }
    try {
      await api.post('/admin/advertisements', adForm);
      toast.success('Advertisement created');
      setAdForm({ title: '', link_url: '', position: 'top', image_base64: '', start_date: '', end_date: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAds();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(detail ? `Failed: ${detail}` : 'Failed to create advertisement');
    }
  };

  const toggleAd = async (ad) => {
    try {
      await api.put(`/admin/advertisements/${ad.id}`, {
        title: ad.title, image_base64: ad.image_base64, link_url: ad.link_url,
        position: ad.position, is_active: !ad.is_active,
        start_date: ad.start_date || null, end_date: ad.end_date || null
      });
      toast.success(ad.is_active ? 'Ad deactivated' : 'Ad activated');
      fetchAds();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || 'Failed to update ad');
    }
  };

  const deleteAd = async (adId) => {
    try {
      await api.delete(`/admin/advertisements/${adId}`);
      toast.success('Ad deleted');
      fetchAds();
    } catch {
      toast.error('Failed to delete ad');
    }
  };

  const riskPieData = aiMonitor ? Object.entries(aiMonitor.risk_distribution || {}).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin Dashboard</h1>
          <p className="text-slate-600">Platform overview and management</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/admin/integrations">
              <Button variant="outline" className="gap-2 rounded-full" data-testid="integrations-link">
                <Settings className="h-4 w-4" />
                Integration Control Panel
              </Button>
            </Link>
            <Button variant="outline" className="gap-2 rounded-full border-amber-400 text-amber-700 hover:bg-amber-50"
              data-testid="seed-btn"
              onClick={async () => {
                try {
                  const r = await api.post('/admin/seed');
                  toast.success(`Seed done! Created: ${r.data.created.join(', ') || 'nothing new (already seeded)'}`);
                  fetchAdminData();
                } catch (err) {
                  toast.error(err?.response?.data?.detail || 'Seed failed');
                }
              }}>
              Seed Demo Data
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.total_users}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.approved_doctors}</div>
                <p className="text-xs text-slate-500 mt-1">of {analytics.total_doctors} total</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.completed_appointments}</div>
                <p className="text-xs text-slate-500 mt-1">of {analytics.total_appointments} total</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{analytics.total_revenue?.toFixed(0)}</div>
                <p className="text-xs text-slate-500 mt-1">{analytics.total_payments} payments</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto mb-2">
            <TabsTrigger value="pending">Doctors ({pendingDoctors.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="commission" data-testid="commission-tab">
              <TrendingUp className="h-3 w-3 mr-1" /> Commission
            </TabsTrigger>
            <TabsTrigger value="ai-monitor" data-testid="ai-monitor-tab">
              <Bot className="h-3 w-3 mr-1" /> AI Monitor
            </TabsTrigger>
            <TabsTrigger value="ads" data-testid="ads-tab">
              <Megaphone className="h-3 w-3 mr-1" /> Ads
            </TabsTrigger>
            <TabsTrigger value="referral" data-testid="referral-tab">
              <Gift className="h-3 w-3 mr-1" /> Referral
            </TabsTrigger>
          </TabsList>

          {/* --- PENDING DOCTORS --- */}
          <TabsContent value="pending" className="mt-6">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Doctors Awaiting Approval</CardTitle></CardHeader>
              <CardContent>
                {pendingDoctors.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No pending doctor approvals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingDoctors.map((doctor, idx) => (
                      <div key={doctor.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200" data-testid={`pending-doctor-${idx}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{doctor.user?.name}</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p><strong>Specialization:</strong> {doctor.specialization}</p>
                              <p><strong>Qualification:</strong> {doctor.qualification}</p>
                              <p><strong>Experience:</strong> {doctor.experience_years} years</p>
                              <p><strong>License:</strong> {doctor.license_number}</p>
                              <p><strong>Fee:</strong> ₹{doctor.consultation_fee}</p>
                              <p><strong>Email:</strong> {doctor.user?.email}</p>
                            </div>
                            {doctor.bio && <p className="text-sm text-slate-600 mt-2">{doctor.bio}</p>}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" onClick={() => handleDoctorApproval(doctor.id, true)} className="gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700" data-testid={`approve-doctor-${idx}`}>
                              <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDoctorApproval(doctor.id, false)} className="gap-2 rounded-full text-red-600 hover:text-red-700" data-testid={`reject-doctor-${idx}`}>
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- ANALYTICS --- */}
          <TabsContent value="analytics" className="mt-6">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Platform Statistics</CardTitle></CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Users', val: analytics.total_users },
                        { label: 'Total Doctors', val: analytics.total_doctors },
                        { label: 'Total Appointments', val: analytics.total_appointments },
                        { label: 'Revenue', val: `₹${analytics.total_revenue?.toFixed(0)}` }
                      ].map(s => (
                        <div key={s.label} className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-sm text-slate-600">{s.label}</p>
                          <p className="text-2xl font-bold mt-1">{s.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- COMMISSION --- */}
          <TabsContent value="commission" className="mt-6 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Commission & Revenue Settings</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <Label>Platform Commission %</Label>
                    <div className="flex gap-2 mt-1">
                      <Input className="w-24" type="number" min="0" max="100" value={editCommission} onChange={e => setEditCommission(e.target.value)} data-testid="commission-input" />
                      <Button className="rounded-full" onClick={savePlatformConfig} data-testid="save-commission-btn">Save</Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Doctor receives {100 - parseFloat(editCommission || 0)}% of each consultation fee</p>
                  </div>
                </div>

                {revenue && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-sm text-emerald-700">Total Gross Revenue</p>
                        <p className="text-2xl font-bold text-emerald-800">₹{revenue.total_gross?.toFixed(0)}</p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-xl">
                        <p className="text-sm text-teal-700">Platform Earnings</p>
                        <p className="text-2xl font-bold text-teal-800">₹{revenue.total_platform_earnings?.toFixed(0)}</p>
                      </div>
                      <div className="p-4 bg-sky-50 rounded-xl">
                        <p className="text-sm text-sky-700">Doctor Payouts</p>
                        <p className="text-2xl font-bold text-sky-800">₹{revenue.total_doctor_payouts?.toFixed(0)}</p>
                      </div>
                    </div>

                    {revenue.by_month?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-sm">Monthly Revenue</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={revenue.by_month}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={v => `₹${v}`} />
                            <Bar dataKey="total_gross" fill="#0D9488" name="Gross" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="platform_earnings" fill="#0EA5E9" name="Platform" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {revenue.by_doctor?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">Doctor Breakdown</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 pr-4">Doctor</th>
                                <th className="text-right py-2 pr-4">Consultations</th>
                                <th className="text-right py-2 pr-4">Gross</th>
                                <th className="text-right py-2 pr-4">Platform Cut</th>
                                <th className="text-right py-2">Net Payout</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revenue.by_doctor.map((d, i) => (
                                <tr key={i} className="border-b hover:bg-slate-50">
                                  <td className="py-2 pr-4 font-medium">{d.doctor_name}</td>
                                  <td className="py-2 pr-4 text-right">{d.consultation_count}</td>
                                  <td className="py-2 pr-4 text-right">₹{d.total_gross}</td>
                                  <td className="py-2 pr-4 text-right text-teal-600">₹{d.platform_cut}</td>
                                  <td className="py-2 text-right text-emerald-600 font-semibold">₹{d.net_payout}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- AI MONITOR --- */}
          <TabsContent value="ai-monitor" className="mt-6 space-y-6">
            {aiMonitor && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total AI Requests', val: aiMonitor.total_requests, color: 'bg-slate-50' },
                    { label: 'Emergency Alerts', val: aiMonitor.emergency_alerts_count, color: 'bg-red-50' },
                    { label: 'High Risk Cases', val: (aiMonitor.risk_distribution?.high || 0) + (aiMonitor.risk_distribution?.critical || 0), color: 'bg-orange-50' },
                    { label: 'Avg / Day (30d)', val: aiMonitor.avg_per_day, color: 'bg-blue-50' }
                  ].map(s => (
                    <Card key={s.label} className={`rounded-2xl ${s.color}`}>
                      <CardContent className="pt-5">
                        <p className="text-xs text-slate-600">{s.label}</p>
                        <p className="text-2xl font-bold mt-1">{s.val}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aiMonitor.requests_by_day?.length > 0 && (
                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle className="text-sm">Daily Requests (last 30 days)</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={aiMonitor.requests_by_day}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0D9488" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {riskPieData.length > 0 && (
                    <Card className="rounded-2xl">
                      <CardHeader><CardTitle className="text-sm">Risk Distribution</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {riskPieData.map((entry, i) => (
                                <Cell key={i} fill={RISK_COLORS[entry.name] || '#94A3B8'} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {aiMonitor.top_specialists?.length > 0 && (
                  <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-sm">Top Suggested Specialists</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiMonitor.top_specialists.map((s, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{s.specialist}</span>
                            <span className="text-sm font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* --- ADS --- */}
          <TabsContent value="ads" className="mt-6 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Upload New Advertisement</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Title</Label>
                    <Input className="mt-1" placeholder="Ad title" value={adForm.title} onChange={e => setAdForm(f => ({ ...f, title: e.target.value }))} data-testid="ad-title-input" />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input className="mt-1" placeholder="https://..." value={adForm.link_url} onChange={e => setAdForm(f => ({ ...f, link_url: e.target.value }))} data-testid="ad-link-input" />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Select value={adForm.position} onValueChange={v => setAdForm(f => ({ ...f, position: v }))}>
                      <SelectTrigger className="mt-1" data-testid="ad-position-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top Banner</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Banner Image</Label>
                    <Input ref={fileInputRef} className="mt-1" type="file" accept="image/*" onChange={handleAdImageUpload} data-testid="ad-image-input" />
                    {adForm.image_base64 && <img src={adForm.image_base64} alt="preview" className="mt-2 h-12 rounded object-cover" />}
                  </div>
                  <div>
                    <Label>Start Date (optional)</Label>
                    <Input className="mt-1" type="date" value={adForm.start_date} onChange={e => setAdForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End Date (optional)</Label>
                    <Input className="mt-1" type="date" value={adForm.end_date} onChange={e => setAdForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
                <Button className="rounded-full gap-2" onClick={submitAd} data-testid="submit-ad-btn">
                  <Upload className="h-4 w-4" /> Create Advertisement
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Active Advertisements ({ads.length})</CardTitle></CardHeader>
              <CardContent>
                {ads.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No advertisements yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-3">Image</th>
                          <th className="text-left py-2 pr-3">Title</th>
                          <th className="text-left py-2 pr-3">Position</th>
                          <th className="text-right py-2 pr-3">Impressions</th>
                          <th className="text-right py-2 pr-3">Clicks</th>
                          <th className="text-right py-2 pr-3">CTR</th>
                          <th className="text-center py-2 pr-3">Status</th>
                          <th className="text-center py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ads.map((ad, i) => {
                          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={ad.id} className="border-b hover:bg-slate-50" data-testid={`ad-row-${i}`}>
                              <td className="py-2 pr-3">
                                <img src={ad.image_base64} alt={ad.title} className="h-10 w-16 object-cover rounded" />
                              </td>
                              <td className="py-2 pr-3 font-medium">{ad.title}</td>
                              <td className="py-2 pr-3 capitalize">{ad.position}</td>
                              <td className="py-2 pr-3 text-right">{ad.impressions}</td>
                              <td className="py-2 pr-3 text-right">{ad.clicks}</td>
                              <td className="py-2 pr-3 text-right">{ctr}%</td>
                              <td className="py-2 pr-3 text-center">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${ad.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {ad.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-2 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button size="sm" variant="ghost" onClick={() => toggleAd(ad)} data-testid={`toggle-ad-${i}`}>
                                    {ad.is_active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteAd(ad.id)} data-testid={`delete-ad-${i}`}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- REFERRAL --- */}
          <TabsContent value="referral" className="mt-6 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Referral Configuration</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <Label>Points per new signup</Label>
                    <Input className="mt-1 w-28" type="number" min="1" value={editReferralPts} onChange={e => setEditReferralPts(e.target.value)} data-testid="referral-pts-input" />
                  </div>
                  <Button className="rounded-full" onClick={savePlatformConfig} data-testid="save-referral-btn">Save</Button>
                </div>
                {referralStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-violet-50 rounded-xl">
                      <p className="text-xs text-violet-600">Total Referrals</p>
                      <p className="text-2xl font-bold text-violet-800">{referralStats.total_referrals}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <p className="text-xs text-amber-600">Total Points Issued</p>
                      <p className="text-2xl font-bold text-amber-800">{referralStats.total_points_issued}</p>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-xl">
                      <p className="text-xs text-teal-600">Points per Signup</p>
                      <p className="text-2xl font-bold text-teal-800">{referralStats.points_per_signup}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {referralStats?.leaderboard?.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader><CardTitle>Top Referrers</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Rank</th>
                          <th className="text-left py-2 pr-4">Name</th>
                          <th className="text-left py-2 pr-4">Email</th>
                          <th className="text-right py-2 pr-4">Referrals</th>
                          <th className="text-right py-2">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralStats.leaderboard.map((u, i) => (
                          <tr key={i} className="border-b hover:bg-slate-50">
                            <td className="py-2 pr-4 font-bold text-slate-500">#{i + 1}</td>
                            <td className="py-2 pr-4 font-medium">{u.name}</td>
                            <td className="py-2 pr-4 text-slate-500">{u.email}</td>
                            <td className="py-2 pr-4 text-right">{u.total_referrals}</td>
                            <td className="py-2 text-right font-semibold text-amber-600">{u.referral_points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
