import React, { useEffect, useState } from 'react';
import { Calendar, Users, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const DoctorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    qualification: '',
    experience_years: '',
    license_number: '',
    bio: '',
    consultation_fee: '',
    available_days: [],
    available_time_slots: []
  });

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      const profileRes = await api.get('/doctors/profile/me');
      setProfile(profileRes.data);
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
    } catch (error) {
      // Profile doesn't exist, show create form
      setProfileDialogOpen(true);
    }

    try {
      const appointmentsRes = await api.get('/appointments');
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Failed to load appointments');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const cleanedData = {
        ...formData,
        experience_years: parseInt(formData.experience_years),
        consultation_fee: parseFloat(formData.consultation_fee)
      };

      if (profile) {
        await api.put('/doctors/profile', cleanedData);
        toast.success('Profile updated successfully');
      } else {
        await api.post('/doctors/profile', cleanedData);
        toast.success('Profile created successfully');
      }
      setProfileDialogOpen(false);
      fetchDoctorData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status?status=${status}`);
      toast.success('Appointment status updated');
      fetchDoctorData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="doctor-dashboard">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Doctor Dashboard</h1>
            <p className="text-slate-600">Manage your consultations and profile</p>
          </div>
          <Button onClick={() => setProfileDialogOpen(true)} variant="outline" data-testid="edit-profile-button">
            Edit Profile
          </Button>
        </div>

        {/* Profile Status */}
        {profile && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{profile.specialization}</h3>
                  <p className="text-sm text-slate-600">{profile.qualification} | {profile.experience_years} years experience</p>
                  <p className="text-sm text-slate-600 mt-1">Consultation Fee: ₹{profile.consultation_fee}</p>
                </div>
                <div className="text-right">
                  {profile.is_approved ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Approved</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                      Pending Approval
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profile?.total_consultations || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Pending Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{appointments.filter(a => a.status === 'pending').length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profile?.rating || 4.5}/5</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No appointments yet</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt, idx) => (
                  <div key={apt.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`appointment-${idx}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{apt.patient?.name || 'Patient'}</p>
                        <p className="text-sm text-slate-600">{apt.appointment_date} at {apt.appointment_time}</p>
                        <p className="text-sm text-slate-600">Type: {apt.appointment_type}</p>
                        {apt.notes && <p className="text-sm text-slate-600 mt-1">Notes: {apt.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        {apt.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${
                          apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="Cardiologist"
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Qualification *</Label>
                <Input
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  placeholder="MBBS, MD"
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Experience (years) *</Label>
                <Input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                  placeholder="10"
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label>License Number *</Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  placeholder="MCI-12345"
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Consultation Fee (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                placeholder="500"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell patients about yourself..."
                rows={4}
                className="mt-2"
              />
            </div>

            <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90" data-testid="save-profile-button">
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DoctorDashboard;
