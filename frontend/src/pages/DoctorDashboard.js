import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, FileText, Star, DollarSign, BookOpen, Plus, X, Wifi, WifiOff, MessageCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BLOG_CATEGORIES = ['General Health', 'Nutrition', 'Fitness', 'Mental Health', 'Pediatrics', "Women's Health", 'Senior Health', 'Cardiology', 'Dermatology', 'Orthopedics'];

const DoctorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [myBlogs, setMyBlogs] = useState([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionTarget, setPrescriptionTarget] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ diagnosis: '', medications: '', instructions: '', follow_up_date: '' });
  const [newSlot, setNewSlot] = useState('');
  const [blogForm, setBlogForm] = useState({ title: '', category: 'General Health', tags: '', content: '', featured_image_base64: '', is_published: true, is_featured: false });
  const [isOnline, setIsOnline] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answerTexts, setAnswerTexts] = useState({});
  const [formData, setFormData] = useState({
    specialization: '', qualification: '', experience_years: '',
    license_number: '', bio: '', consultation_fee: '',
    available_days: [], available_time_slots: []
  });

  useEffect(() => {
    fetchDoctorData();
    fetchEarnings();
    fetchMyBlogs();
    fetchQuestions();
  }, []);

  const fetchDoctorData = async () => {
    try {
      const profileRes = await api.get('/doctors/profile/me');
      setProfile(profileRes.data);
      setIsOnline(profileRes.data.is_online || false);
      setFormData({
        specialization: profileRes.data.specialization || '',
        qualification: profileRes.data.qualification || '',
        experience_years: profileRes.data.experience_years || '',
        license_number: profileRes.data.license_number || '',
        bio: profileRes.data.bio || '',
        consultation_fee: profileRes.data.consultation_fee || '',
        available_days: profileRes.data.available_days || [],
        available_time_slots: profileRes.data.available_time_slots || []
      });
    } catch {
      setProfileDialogOpen(true);
    }
    try {
      const appointmentsRes = await api.get('/appointments');
      setAppointments(appointmentsRes.data);
    } catch {
      toast.error('Failed to load appointments');
    }
  };

  const fetchEarnings = async () => {
    try {
      const [earningsRes, historyRes] = await Promise.all([
        api.get('/doctors/earnings'),
        api.get('/doctors/payment-history')
      ]);
      setEarnings(earningsRes.data);
      setPaymentHistory(historyRes.data);
    } catch {}
  };

  const fetchMyBlogs = async () => {
    try {
      const res = await api.get('/blogs?published_only=false');
      setMyBlogs(res.data.slice(0, 5));
    } catch {}
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/doctors/questions/inbox');
      setQuestions(res.data);
    } catch {}
  };

  const toggleOnlineStatus = async () => {
    const next = !isOnline;
    try {
      await api.put('/doctors/online-status', { is_online: next });
      setIsOnline(next);
      toast.success(next ? 'You are now online and visible to patients' : 'You are now offline');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const submitAnswer = async (qId) => {
    const answer = answerTexts[qId]?.trim();
    if (!answer) return;
    try {
      await api.put(`/doctors/questions/${qId}/answer`, { answer });
      toast.success('Answer sent');
      setAnswerTexts(t => ({ ...t, [qId]: '' }));
      fetchQuestions();
    } catch {
      toast.error('Failed to send answer');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const cleaned = {
        ...formData,
        experience_years: parseInt(formData.experience_years),
        consultation_fee: parseFloat(formData.consultation_fee)
      };
      if (profile) {
        await api.put('/doctors/profile', cleaned);
        toast.success('Profile updated');
      } else {
        await api.post('/doctors/profile', cleaned);
        toast.success('Profile created');
      }
      setProfileDialogOpen(false);
      fetchDoctorData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    }
  };

  const toggleDay = (day) => {
    const days = formData.available_days.includes(day)
      ? formData.available_days.filter(d => d !== day)
      : [...formData.available_days, day];
    setFormData(f => ({ ...f, available_days: days }));
  };

  const addSlot = () => {
    if (!newSlot) return;
    if (!formData.available_time_slots.includes(newSlot)) {
      setFormData(f => ({ ...f, available_time_slots: [...f.available_time_slots, newSlot] }));
    }
    setNewSlot('');
  };

  const removeSlot = (slot) => {
    setFormData(f => ({ ...f, available_time_slots: f.available_time_slots.filter(s => s !== slot) }));
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, null, { params: { status } });
      toast.success('Status updated');
      fetchDoctorData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openPrescriptionDialog = (apt) => {
    setPrescriptionTarget(apt);
    setPrescriptionForm({ diagnosis: '', medications: '', instructions: '', follow_up_date: '' });
    setPrescriptionDialogOpen(true);
  };

  const handleSubmitPrescription = async () => {
    if (!prescriptionForm.diagnosis) { toast.error('Diagnosis is required.'); return; }
    try {
      const meds = prescriptionForm.medications.split('\n').map(m => m.trim()).filter(Boolean);
      await api.post('/prescriptions', {
        appointment_id: prescriptionTarget.id,
        diagnosis: prescriptionForm.diagnosis,
        medications: meds,
        instructions: prescriptionForm.instructions,
        follow_up_date: prescriptionForm.follow_up_date || null
      });
      toast.success('Prescription created and PDF generated.');
      setPrescriptionDialogOpen(false);
      fetchDoctorData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create prescription.');
    }
  };

  const handleBlogImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error('Image must be under 800KB. Please compress it first.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setBlogForm(f => ({ ...f, featured_image_base64: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const submitBlog = async () => {
    if (!blogForm.title || !blogForm.content) { toast.error('Title and content are required'); return; }
    try {
      const tagsArr = blogForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/blogs', { ...blogForm, tags: tagsArr });
      toast.success('Blog post created');
      setBlogForm({ title: '', category: 'General Health', tags: '', content: '', featured_image_base64: '', is_published: true, is_featured: false });
      fetchMyBlogs();
    } catch {
      toast.error('Failed to create blog post');
    }
  };

  const statusColor = (s) => ({
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700'
  }[s] || 'bg-slate-100 text-slate-700');

  const statusBorderColor = (s) => ({
    confirmed: 'border-l-emerald-400',
    completed: 'border-l-blue-400',
    cancelled: 'border-l-red-400',
    pending: 'border-l-amber-400'
  }[s] || 'border-l-slate-200');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="doctor-dashboard">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>Doctor Dashboard</h1>
            <p className="text-slate-600">Manage your consultations and profile</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="online-toggle"
              onClick={toggleOnlineStatus}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-colors ${isOnline ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Available Now' : 'Go Online'}
            </button>
            <Button onClick={() => setProfileDialogOpen(true)} variant="outline" className="rounded-full" data-testid="edit-profile-button">
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Status */}
        {profile && (
          <Card className="mb-8 rounded-2xl overflow-hidden border-0 shadow-md">
            <div className={`p-6 ${isOnline ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-slate-700 to-slate-800'} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">{profile.specialization}</h3>
                  <p className="text-sm text-white/80">{profile.qualification} · {profile.experience_years} yrs experience</p>
                  <p className="text-sm text-white/80 mt-0.5">Consultation Fee: ₹{profile.consultation_fee}</p>
                  {profile.available_days?.length > 0 && (
                    <p className="text-xs text-white/60 mt-1">Available: {profile.available_days.slice(0, 4).join(', ')}{profile.available_days.length > 4 ? '...' : ''}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {profile.is_approved ? (
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-semibold">Verified</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-amber-400/80 rounded-full text-sm font-semibold">Pending Approval</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-blue-100 text-sm font-medium">Total Consultations</p>
                <Calendar className="h-5 w-5 text-blue-200" />
              </div>
              <div className="text-4xl font-bold">{profile?.total_consultations || 0}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-amber-100 text-sm font-medium">Pending Appointments</p>
                <Calendar className="h-5 w-5 text-amber-200" />
              </div>
              <div className="text-4xl font-bold">{appointments.filter(a => a.status === 'pending').length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-violet-100 text-sm font-medium">Patient Rating</p>
                <Star className="h-5 w-5 text-violet-200 fill-violet-200" />
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-4xl font-bold">{profile?.rating || 0}</div>
                <span className="text-violet-200 text-sm">/5</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="appointments">
          <TabsList className="flex flex-wrap gap-1 h-auto mb-2">
            <TabsTrigger value="appointments"><Calendar className="h-3 w-3 mr-1" /> Appointments</TabsTrigger>
            <TabsTrigger value="earnings" data-testid="earnings-tab"><DollarSign className="h-3 w-3 mr-1" /> Earnings</TabsTrigger>
            <TabsTrigger value="blogs" data-testid="blogs-tab"><BookOpen className="h-3 w-3 mr-1" /> Write Blog</TabsTrigger>
            <TabsTrigger value="questions" data-testid="questions-tab">
              <MessageCircle className="h-3 w-3 mr-1" /> Questions
              {questions.filter(q => !q.is_answered).length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{questions.filter(q => !q.is_answered).length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* --- APPOINTMENTS --- */}
          <TabsContent value="appointments" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Appointments</CardTitle></CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No appointments yet</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt, idx) => (
                      <div key={apt.id} className={`p-4 bg-white rounded-xl border border-slate-100 border-l-4 ${statusBorderColor(apt.status)} shadow-sm`} data-testid={`appointment-${idx}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{apt.patient?.name || 'Patient'}</p>
                            <p className="text-sm text-slate-600">{apt.appointment_date} at {apt.appointment_time}</p>
                            <p className="text-sm text-slate-500 capitalize">{apt.appointment_type}</p>
                            {apt.notes && <p className="text-sm text-slate-600 mt-1 italic">"{apt.notes}"</p>}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(apt.status)}`}>{apt.status}</span>
                            {apt.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')} data-testid={`confirm-apt-${idx}`}>Confirm</Button>
                                <Button size="sm" variant="outline" className="rounded-full text-red-600 border-red-200" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')} data-testid={`cancel-apt-${idx}`}>Cancel</Button>
                              </div>
                            )}
                            {apt.status === 'confirmed' && (
                              <div className="flex gap-2">
                                <Button size="sm" className="rounded-full" onClick={() => updateAppointmentStatus(apt.id, 'completed')} data-testid={`complete-apt-${idx}`}>Complete</Button>
                                {!apt.prescription_url && (
                                  <Button size="sm" variant="outline" className="rounded-full gap-1 text-primary border-primary/30" onClick={() => openPrescriptionDialog(apt)} data-testid={`write-rx-${idx}`}>
                                    <FileText className="h-3 w-3" /> Prescription
                                  </Button>
                                )}
                              </div>
                            )}
                            {apt.status === 'completed' && !apt.prescription_url && (
                              <Button size="sm" variant="outline" className="rounded-full gap-1 text-primary border-primary/30" onClick={() => openPrescriptionDialog(apt)} data-testid={`write-rx-completed-${idx}`}>
                                <FileText className="h-3 w-3" /> Write Prescription
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- EARNINGS --- */}
          <TabsContent value="earnings" className="mt-4 space-y-6">
            {earnings && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-2xl bg-emerald-50">
                  <CardContent className="pt-5">
                    <p className="text-sm text-emerald-700">Gross Earned</p>
                    <p className="text-2xl font-bold text-emerald-800">₹{earnings.total_gross}</p>
                    <p className="text-xs text-emerald-600 mt-1">{earnings.payment_count} consultations</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl bg-red-50">
                  <CardContent className="pt-5">
                    <p className="text-sm text-red-600">Platform Commission</p>
                    <p className="text-2xl font-bold text-red-700">₹{earnings.total_platform_cut}</p>
                    <p className="text-xs text-red-500 mt-1">Deducted by platform</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl bg-teal-50">
                  <CardContent className="pt-5">
                    <p className="text-sm text-teal-700">Net Payout</p>
                    <p className="text-2xl font-bold text-teal-800">₹{earnings.total_net}</p>
                    <p className="text-xs text-teal-600 mt-1">Your earnings</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-sm">Payment History</CardTitle></CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No payments yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-3">Date</th>
                          <th className="text-left py-2 pr-3">Patient</th>
                          <th className="text-right py-2 pr-3">Fee</th>
                          <th className="text-right py-2 pr-3">Commission</th>
                          <th className="text-right py-2">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((p, i) => (
                          <tr key={i} className="border-b hover:bg-slate-50">
                            <td className="py-2 pr-3 text-slate-500">{p.created_at?.slice(0, 10)}</td>
                            <td className="py-2 pr-3">{p.patient_name || '-'}</td>
                            <td className="py-2 pr-3 text-right">₹{p.amount}</td>
                            <td className="py-2 pr-3 text-right text-red-500">-₹{p.platform_earnings || 0}</td>
                            <td className="py-2 text-right font-semibold text-emerald-600">₹{p.doctor_earnings || p.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- BLOG --- */}
          <TabsContent value="blogs" className="mt-4 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Write a Blog Post</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input className="mt-1" placeholder="e.g. 5 Tips for Heart Health" value={blogForm.title} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))} data-testid="blog-title-input" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={blogForm.category} onValueChange={v => setBlogForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="mt-1" data-testid="blog-category-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input className="mt-1" placeholder="health, heart, tips" value={blogForm.tags} onChange={e => setBlogForm(f => ({ ...f, tags: e.target.value }))} data-testid="blog-tags-input" />
                </div>
                <div>
                  <Label>Content *</Label>
                  <Textarea className="mt-1" rows={8} placeholder="Write your article here..." value={blogForm.content} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))} data-testid="blog-content-input" />
                </div>
                <div>
                  <Label>Featured Image (optional)</Label>
                  <Input className="mt-1" type="file" accept="image/*" onChange={handleBlogImageUpload} data-testid="blog-image-input" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={blogForm.is_published} onChange={e => setBlogForm(f => ({ ...f, is_published: e.target.checked }))} data-testid="blog-published-check" />
                    Publish immediately
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={blogForm.is_featured} onChange={e => setBlogForm(f => ({ ...f, is_featured: e.target.checked }))} />
                    Featured post
                  </label>
                </div>
                <Button className="rounded-full gap-2" onClick={submitBlog} data-testid="submit-blog-btn">
                  <Plus className="h-4 w-4" /> Publish Post
                </Button>
              </CardContent>
            </Card>

            {myBlogs.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-sm">Your Recent Posts</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {myBlogs.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-sm">{b.title}</p>
                          <p className="text-xs text-slate-500">{b.category} · {b.created_at?.slice(0, 10)}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {b.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* --- QUESTIONS INBOX --- */}
          <TabsContent value="questions" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Patient Questions</CardTitle></CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No questions yet. Patients can ask you questions before booking.</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.id} className={`p-4 rounded-xl border ${q.is_answered ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'}`} data-testid={`question-${q.id}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-sm">{q.patient_name}</p>
                            <p className="text-xs text-slate-500">{q.created_at?.slice(0, 10)}</p>
                          </div>
                          {!q.is_answered && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Unanswered</span>}
                          {q.is_answered && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Answered</span>}
                        </div>
                        <p className="text-sm mb-3"><span className="font-medium">Q:</span> {q.question}</p>
                        {q.is_answered ? (
                          <p className="text-sm text-slate-600 bg-white rounded-lg p-2 border"><span className="font-medium">A:</span> {q.answer}</p>
                        ) : (
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Type your answer..."
                              rows={2}
                              value={answerTexts[q.id] || ''}
                              onChange={e => setAnswerTexts(t => ({ ...t, [q.id]: e.target.value }))}
                              className="flex-1 text-sm"
                              data-testid={`answer-input-${q.id}`}
                            />
                            <Button size="sm" className="rounded-full self-end" onClick={() => submitAnswer(q.id)} data-testid={`send-answer-${q.id}`}>Send</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile ? 'Edit Profile' : 'Create Doctor Profile'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Specialization *</Label>
                <Input value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="Cardiologist" required className="mt-2" />
              </div>
              <div>
                <Label>Qualification *</Label>
                <Input value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} placeholder="MBBS, MD" required className="mt-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Experience (years) *</Label>
                <Input type="number" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} placeholder="10" required className="mt-2" />
              </div>
              <div>
                <Label>License Number *</Label>
                <Input value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} placeholder="MCI-12345" required className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Consultation Fee (₹) *</Label>
              <Input type="number" step="0.01" value={formData.consultation_fee} onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })} placeholder="500" required className="mt-2" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell patients about yourself..." rows={3} className="mt-2" />
            </div>

            {/* Availability */}
            <div>
              <Label>Available Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map(day => (
                  <button key={day} type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${formData.available_days.includes(day) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-300 hover:border-primary'}`}
                    data-testid={`day-${day}`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Time Slots</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {formData.available_time_slots.map(slot => (
                  <span key={slot} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs">
                    {slot}
                    <button type="button" onClick={() => removeSlot(slot)} className="text-slate-400 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)} className="w-36" data-testid="add-slot-input" />
                <Button type="button" variant="outline" className="rounded-full" onClick={addSlot} data-testid="add-slot-btn">Add</Button>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90" data-testid="save-profile-button">
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Write Prescription</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Patient: <strong>{prescriptionTarget?.patient?.name}</strong></p>
            <div>
              <Label>Diagnosis *</Label>
              <Input value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })} placeholder="e.g. Viral fever" className="mt-1" data-testid="rx-diagnosis-input" />
            </div>
            <div>
              <Label>Medications (one per line)</Label>
              <Textarea value={prescriptionForm.medications} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medications: e.target.value })} placeholder={"Tab Paracetamol 500mg - TDS for 5 days\nTab Cetirizine 10mg - OD at night"} rows={4} className="mt-1" data-testid="rx-medications-input" />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} placeholder="Take with food. Rest well." rows={2} className="mt-1" data-testid="rx-instructions-input" />
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input type="date" value={prescriptionForm.follow_up_date} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, follow_up_date: e.target.value })} min={new Date().toISOString().split('T')[0]} className="mt-1" data-testid="rx-followup-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setPrescriptionDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={handleSubmitPrescription} data-testid="submit-rx-button">Generate Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DoctorDashboard;
