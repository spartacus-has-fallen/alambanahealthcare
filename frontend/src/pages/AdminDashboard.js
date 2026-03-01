import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, Calendar, DollarSign, CheckCircle, X, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, doctorsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/doctors/pending')
      ]);
      setAnalytics(analyticsRes.data);
      setPendingDoctors(doctorsRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    }
  };

  const handleDoctorApproval = async (doctorId, approved) => {
    try {
      await api.put(`/admin/doctors/${doctorId}/approve?approved=${approved}`);
      toast.success(`Doctor ${approved ? 'approved' : 'rejected'} successfully`);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update doctor status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Platform overview and management</p>
          <div className="mt-4">
            <Link to="/admin/integrations">
              <Button variant="outline" className="gap-2" data-testid="integrations-link">
                <Settings className="h-4 w-4" />
                Integration Control Panel
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.total_users}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.approved_doctors}</div>
                <p className="text-xs text-slate-500 mt-1">of {analytics.total_doctors} total</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.completed_appointments}</div>
                <p className="text-xs text-slate-500 mt-1">of {analytics.total_appointments} total</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{analytics.total_revenue.toFixed(2)}</div>
                <p className="text-xs text-slate-500 mt-1">{analytics.total_payments} payments</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pending">Pending Doctors ({pendingDoctors.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Doctors Awaiting Approval</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingDoctors.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">No pending doctor approvals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingDoctors.map((doctor, idx) => (
                      <div key={doctor.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`pending-doctor-${idx}`}>
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
                              <p><strong>Phone:</strong> {doctor.user?.phone}</p>
                            </div>
                            {doctor.bio && <p className="text-sm text-slate-600 mt-2">{doctor.bio}</p>}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleDoctorApproval(doctor.id, true)}
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                              data-testid={`approve-doctor-${idx}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDoctorApproval(doctor.id, false)}
                              className="gap-2 text-red-600 hover:text-red-700"
                              data-testid={`reject-doctor-${idx}`}
                            >
                              <X className="h-4 w-4" />
                              Reject
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

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">User Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">Total Users</p>
                          <p className="text-2xl font-bold mt-1">{analytics.total_users}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">Total Doctors</p>
                          <p className="text-2xl font-bold mt-1">{analytics.total_doctors}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Appointment Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">Total Appointments</p>
                          <p className="text-2xl font-bold mt-1">{analytics.total_appointments}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">Completed</p>
                          <p className="text-2xl font-bold mt-1">{analytics.completed_appointments}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Revenue Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <p className="text-sm text-emerald-600">Total Revenue</p>
                          <p className="text-2xl font-bold mt-1 text-emerald-700">₹{analytics.total_revenue.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600">Total Payments</p>
                          <p className="text-2xl font-bold mt-1 text-blue-700">{analytics.total_payments}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
