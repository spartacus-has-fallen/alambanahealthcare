import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileHeart, BrainCircuit, Gift, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { getUser } from '@/utils/auth';
import { toast } from 'sonner';

const PatientDashboard = () => {
  const user = getUser();
  const [appointments, setAppointments] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, recordsRes, referralRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/health-records'),
        api.get('/referral/stats')
      ]);
      
      setAppointments(appointmentsRes.data.slice(0, 5));
      setHealthRecords(recordsRes.data.slice(0, 5));
      setReferralStats(referralRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: <Calendar className="h-6 w-6" />, title: 'Find Doctors', link: '/doctors', color: 'bg-blue-100 text-blue-600' },
    { icon: <BrainCircuit className="h-6 w-6" />, title: 'AI Symptom Checker', link: '/ai-checker', color: 'bg-purple-100 text-purple-600' },
    { icon: <FileHeart className="h-6 w-6" />, title: 'Health Records', link: '/health-records', color: 'bg-emerald-100 text-emerald-600' },
    { icon: <Gift className="h-6 w-6" />, title: 'Referral Program', link: '/referral', color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="patient-dashboard">
        {/* Welcome Header */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Health Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{healthRecords.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Referral Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{referralStats?.total_points || 0}</div>
            </CardContent>
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
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg" data-testid={`appointment-${idx}`}>
                    <div>
                      <p className="font-semibold">{apt.doctor?.user?.name || 'Doctor'}</p>
                      <p className="text-sm text-slate-600">{apt.appointment_date} at {apt.appointment_time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {apt.status}
                    </span>
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
              <p className="text-slate-600 text-center py-8">No health records yet. Start tracking your vitals!</p>
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
      </div>

      <Footer />
    </div>
  );
};

export default PatientDashboard;
