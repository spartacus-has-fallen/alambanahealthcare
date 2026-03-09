import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileHeart, BrainCircuit, Gift, X, RotateCcw, FileText, Star, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RatingForm from '@/components/RatingForm';
import api from '@/utils/api';
import { getUser } from '@/utils/auth';
import { toast } from 'sonner';

const PatientDashboard = () => {
  const user = getUser();
  const [appointments, setAppointments] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reschedule dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Rate dialog
  const [rateTarget, setRateTarget] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, recordsRes, referralRes, paymentsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/health-records'),
        api.get('/referral/stats'),
        api.get('/payments/history')
      ]);
      setAppointments(appointmentsRes.data.slice(0, 5));
      setHealthRecords(recordsRes.data.slice(0, 5));
      setReferralStats(referralRes.data);
      setPayments(paymentsRes.data.slice(0, 10));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      toast.success('Appointment cancelled.');
      fetchDashboardData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to cancel appointment.');
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time.');
      return;
    }
    try {
      await api.put(`/appointments/${rescheduleTarget}/reschedule`, {
        new_date: rescheduleDate,
        new_time: rescheduleTime
      });
      toast.success('Appointment rescheduled.');
      setRescheduleOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to reschedule.');
    }
  };

  const handleViewPrescription = async (appointmentId) => {
    try {
      const res = await api.get(`/prescriptions/appointment/${appointmentId}`);
      const { prescription_file_base64, id } = res.data;
      if (!prescription_file_base64) {
        toast.info('Prescription PDF not yet generated.');
        return;
      }
      const byteChars = atob(prescription_file_base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Prescription not available yet.');
    }
  };

  const quickActions = [
    { icon: <Calendar className="h-6 w-6" />, title: 'Find Doctors', link: '/doctors', color: 'bg-blue-100 text-blue-600' },
    { icon: <BrainCircuit className="h-6 w-6" />, title: 'AI Symptom Checker', link: '/ai-checker', color: 'bg-purple-100 text-purple-600' },
    { icon: <FileHeart className="h-6 w-6" />, title: 'Health Records', link: '/health-records', color: 'bg-emerald-100 text-emerald-600' },
    { icon: <Gift className="h-6 w-6" />, title: 'Referral Program', link: '/referral', color: 'bg-amber-100 text-amber-600' },
  ];

  const statusColor = (s) => ({
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700'
  }[s] || 'bg-slate-100 text-slate-700');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="patient-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-slate-600">Manage your health and appointments</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.link} data-testid={`quick-action-${idx}`}>
              <Card className="card-hover cursor-pointer">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center mb-4`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-slate-600">Total Appointments</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{appointments.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-slate-600">Health Records</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{healthRecords.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-slate-600">Referral Points</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{referralStats?.total_points || 0}</div></CardContent>
          </Card>
        </div>

        {/* Recent Appointments */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Appointments</CardTitle>
            <Link to="/doctors">
              <Button variant="outline" size="sm" data-testid="book-appointment-button">Book New</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No appointments yet. Book your first consultation!</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg" data-testid={`appointment-${idx}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{apt.doctor?.user?.name || 'Doctor'}</p>
                        <p className="text-sm text-slate-600">{apt.appointment_date} at {apt.appointment_time}</p>
                        <p className="text-xs text-slate-400 capitalize">{apt.appointment_type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['pending', 'confirmed'].includes(apt.status) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleCancel(apt.id)}
                            data-testid={`cancel-apt-${idx}`}
                          >
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => { setRescheduleTarget(apt.id); setRescheduleOpen(true); }}
                            data-testid={`reschedule-apt-${idx}`}
                          >
                            <RotateCcw className="h-3 w-3" /> Reschedule
                          </Button>
                        </>
                      )}
                      {apt.status === 'completed' && apt.prescription_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-primary border-primary/30 hover:bg-primary/5"
                          onClick={() => handleViewPrescription(apt.id)}
                          data-testid={`view-rx-${idx}`}
                        >
                          <FileText className="h-3 w-3" /> Prescription
                        </Button>
                      )}
                      {apt.status === 'completed' && apt.payment_status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => setRateTarget(apt)}
                          data-testid={`rate-apt-${idx}`}
                        >
                          <Star className="h-3 w-3" /> Rate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Health Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Health Records</CardTitle>
            <Link to="/health-records">
              <Button variant="outline" size="sm" data-testid="add-record-button">Add Record</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {healthRecords.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No health records yet.</p>
            ) : (
              <div className="space-y-4">
                {healthRecords.map((record, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg" data-testid={`health-record-${idx}`}>
                    <div>
                      <p className="font-semibold">{record.record_type} Record</p>
                      <p className="text-sm text-slate-600">{record.date}</p>
                    </div>
                    <div className="text-right text-sm">
                      {record.weight && <p>Weight: {record.weight} kg</p>}
                      {record.blood_pressure_systolic && <p>BP: {record.blood_pressure_systolic}/{record.blood_pressure_diastolic}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card className="mt-8 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">Amount</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2">Razorpay ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50" data-testid={`payment-row-${i}`}>
                        <td className="py-2 pr-4 text-slate-500">{p.created_at?.slice(0, 10)}</td>
                        <td className="py-2 pr-4 font-semibold">₹{p.amount}</td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 text-slate-400 text-xs font-mono">{p.razorpay_payment_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>New Date</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="mt-1"
                min={new Date().toISOString().split('T')[0]} data-testid="reschedule-date-input" />
            </div>
            <div>
              <Label>New Time</Label>
              <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="mt-1"
                data-testid="reschedule-time-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleReschedule} data-testid="confirm-reschedule-button">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Doctor Dialog */}
      <Dialog open={!!rateTarget} onOpenChange={(o) => !o && setRateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Consultation</DialogTitle>
          </DialogHeader>
          {rateTarget && (
            <RatingForm
              appointmentId={rateTarget.id}
              onSuccess={() => { setRateTarget(null); toast.success('Thank you for your feedback!'); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PatientDashboard;
