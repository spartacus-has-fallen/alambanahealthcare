import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, FileText, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionTarget, setPrescriptionTarget] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '', medications: '', instructions: '', follow_up_date: ''
  });
  const [formData, setFormData] = useState({
    specialization: '', qualification: '', experience_years: '',
    license_number: '', bio: '', consultation_fee: '',
    available_days: [], available_time_slots: []
  });

  useEffect(() => { fetchDoctorData(); }, []);

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
      const meds = prescriptionForm.medications
        .split('\n')
        .map(m => m.trim())
        .filter(Boolean);
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

  const statusColor = (s) => ({
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700'
  }[s] || 'bg-slate-100 text-slate-700');

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
                  <h3 className="font-semibold text-lg mb-1">{profile.specialization}</h3>
                  <p className="text-sm text-slate-600">{profile.qualification} · {profile.experience_years} yrs experience</p>
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
            <CardHeader><CardTitle className="text-sm font-medium text-slate-600">Total Consultations</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{profile?.total_consultations || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{appointments.filter(a => a.status === 'pending').length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-slate-600">Rating</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{profile?.rating || 0}</div>
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <span className="text-slate-500 text-sm">/5</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No appointments yet</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt, idx) => (
                  <div key={apt.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`appointment-${idx}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{apt.patient?.name || 'Patient'}</p>
                        <p className="text-sm text-slate-600">{apt.appointment_date} at {apt.appointment_time}</p>
                        <p className="text-sm text-slate-500 capitalize">{apt.appointment_type}</p>
                        {apt.notes && <p className="text-sm text-slate-600 mt-1 italic">"{apt.notes}"</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                        {apt.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                              data-testid={`confirm-apt-${idx}`}>Confirm</Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200"
                              onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                              data-testid={`cancel-apt-${idx}`}>Cancel</Button>
                          </div>
                        )}
                        {apt.status === 'confirmed' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                              data-testid={`complete-apt-${idx}`}>Complete</Button>
                            {!apt.prescription_url && (
                              <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30"
                                onClick={() => openPrescriptionDialog(apt)}
                                data-testid={`write-rx-${idx}`}>
                                <FileText className="h-3 w-3" /> Prescription
                              </Button>
                            )}
                          </div>
                        )}
                        {apt.status === 'completed' && !apt.prescription_url && (
                          <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30"
                            onClick={() => openPrescriptionDialog(apt)}
                            data-testid={`write-rx-completed-${idx}`}>
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
                <Input value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="Cardiologist" required className="mt-2" />
              </div>
              <div>
                <Label>Qualification *</Label>
                <Input value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  placeholder="MBBS, MD" required className="mt-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Experience (years) *</Label>
                <Input type="number" value={formData.experience_years} onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                  placeholder="10" required className="mt-2" />
              </div>
              <div>
                <Label>License Number *</Label>
                <Input value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  placeholder="MCI-12345" required className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Consultation Fee (₹) *</Label>
              <Input type="number" step="0.01" value={formData.consultation_fee}
                onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                placeholder="500" required className="mt-2" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell patients about yourself..." rows={4} className="mt-2" />
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
          <DialogHeader>
            <DialogTitle>Write Prescription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Patient: <strong>{prescriptionTarget?.patient?.name}</strong></p>
            <div>
              <Label>Diagnosis *</Label>
              <Input value={prescriptionForm.diagnosis}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                placeholder="e.g. Viral fever" className="mt-1" data-testid="rx-diagnosis-input" />
            </div>
            <div>
              <Label>Medications (one per line)</Label>
              <Textarea value={prescriptionForm.medications}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, medications: e.target.value})}
                placeholder={"Tab Paracetamol 500mg - TDS for 5 days\nTab Cetirizine 10mg - OD at night"}
                rows={4} className="mt-1" data-testid="rx-medications-input" />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea value={prescriptionForm.instructions}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})}
                placeholder="Take with food. Rest well. Drink plenty of fluids."
                rows={2} className="mt-1" data-testid="rx-instructions-input" />
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input type="date" value={prescriptionForm.follow_up_date}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, follow_up_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]} className="mt-1" data-testid="rx-followup-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrescriptionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitPrescription} data-testid="submit-rx-button">Generate Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DoctorDashboard;
