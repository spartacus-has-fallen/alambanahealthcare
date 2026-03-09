import React, { useEffect, useState } from 'react';
import { Search, Stethoscope, Calendar, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import DoctorRatings from '@/components/DoctorRatings';
import api from '@/utils/api';
import { toast } from 'sonner';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratingsDoctor, setRatingsDoctor] = useState(null);
  const [appointmentData, setAppointmentData] = useState({
    appointment_type: 'online', appointment_date: '', appointment_time: '', notes: ''
  });
  const [booking, setBooking] = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    let filtered = doctors;
    if (specialtyFilter !== 'all') filtered = filtered.filter(d => d.specialization === specialtyFilter);
    if (searchQuery) filtered = filtered.filter(d =>
      d.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, specialtyFilter]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors?approved_only=true');
      setDoctors(res.data);
    } catch {
      toast.error('Failed to load doctors');
    }
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      // Step 1: Create appointment
      const aptRes = await api.post('/appointments', {
        doctor_id: selectedDoctor.id, ...appointmentData
      });
      const appointment = aptRes.data;

      // Step 2: If fee > 0 and Razorpay is configured, initiate payment
      const fee = selectedDoctor.consultation_fee;
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;

      if (fee > 0 && razorpayKey) {
        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error('Payment service unavailable. Appointment booked, pay at clinic.');
          setDialogOpen(false);
          return;
        }
        const orderRes = await api.post('/payments/create-order', {
          appointment_id: appointment.id,
          amount: fee
        });
        const { order_id, amount, currency } = orderRes.data;

        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: razorpayKey,
            amount: amount * 100,
            currency,
            order_id,
            name: 'Alambana Healthcare',
            description: `Consultation with ${selectedDoctor.user?.name}`,
            theme: { color: '#0D9488' },
            handler: async (response) => {
              try {
                await api.post('/payments/verify', {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                });
                toast.success('Payment successful! Appointment confirmed.');
                resolve();
              } catch {
                toast.error('Payment verification failed. Contact support.');
                reject();
              }
            },
            modal: { ondismiss: () => { toast.info('Payment cancelled.'); resolve(); } }
          });
          rzp.open();
        });
      } else {
        toast.success('Appointment booked! Payment to be made at clinic.');
      }

      setDialogOpen(false);
      setAppointmentData({ appointment_type: 'online', appointment_date: '', appointment_time: '', notes: '' });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const specialties = [...new Set(doctors.map(d => d.specialization))];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="doctor-search-page">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Doctors</h1>
          <p className="text-slate-600">Search and book consultations with verified healthcare professionals</p>
        </div>

        <div className="flex gap-6">
        <div className="flex-1 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input placeholder="Search by name or specialty..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="doctor-search-input" />
          </div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger data-testid="specialty-filter"><SelectValue placeholder="All Specialties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filteredDoctors.length === 0 ? (
          <Card className="p-12 text-center">
            <Stethoscope className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No doctors found. Try adjusting your search.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, idx) => (
              <Card key={doctor.id} className="card-hover" data-testid={`doctor-card-${idx}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{doctor.user?.name}</h3>
                      <p className="text-sm text-slate-600">{doctor.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                      <span>{doctor.rating > 0 ? `${doctor.rating}/5` : 'No ratings yet'} ({doctor.total_consultations || 0} consultations)</span>
                    </div>
                    <p><strong>Qualification:</strong> {doctor.qualification}</p>
                    <p><strong>Experience:</strong> {doctor.experience_years} years</p>
                    <p className="text-primary font-semibold text-base">₹{doctor.consultation_fee}</p>
                  </div>

                  {doctor.bio && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doctor.bio}</p>}

                  <div className="flex gap-2">
                    <Button onClick={() => handleBookAppointment(doctor)}
                      className="flex-1 rounded-full bg-primary hover:bg-primary/90"
                      data-testid={`book-button-${idx}`}>
                      <Calendar className="h-4 w-4 mr-2" /> Book
                    </Button>
                    {doctor.total_consultations > 0 && (
                      <Button variant="outline" size="sm" className="rounded-full gap-1"
                        onClick={() => setRatingsDoctor(doctor)}
                        data-testid={`ratings-button-${idx}`}>
                        <Star className="h-3 w-3" /> Reviews
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>{/* end main col */}

        {/* Sidebar Ad */}
        <div className="hidden lg:block w-56 flex-shrink-0 pt-1">
          <AdBanner position="sidebar" />
        </div>
        </div>{/* end flex row */}
      </div>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book with {selectedDoctor?.user?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAppointment} className="space-y-4">
            <div>
              <Label>Consultation Type</Label>
              <Select value={appointmentData.appointment_type}
                onValueChange={(v) => setAppointmentData({...appointmentData, appointment_type: v})}>
                <SelectTrigger className="mt-2" data-testid="appointment-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Consultation</SelectItem>
                  <SelectItem value="offline">Offline Appointment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={appointmentData.appointment_date}
                onChange={(e) => setAppointmentData({...appointmentData, appointment_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]} required className="mt-2"
                data-testid="appointment-date-input" />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={appointmentData.appointment_time}
                onChange={(e) => setAppointmentData({...appointmentData, appointment_time: e.target.value})}
                required className="mt-2" data-testid="appointment-time-input" />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input value={appointmentData.notes}
                onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                placeholder="Any specific concerns..." className="mt-2" />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Consultation Fee</p>
              <p className="text-2xl font-bold text-primary">₹{selectedDoctor?.consultation_fee}</p>
              {selectedDoctor?.consultation_fee > 0 && process.env.REACT_APP_RAZORPAY_KEY_ID && (
                <p className="text-xs text-slate-400 mt-1">Payment will be processed via Razorpay</p>
              )}
            </div>
            <Button type="submit" disabled={booking}
              className="w-full rounded-full bg-primary hover:bg-primary/90"
              data-testid="confirm-booking-button">
              {booking ? 'Processing...' : selectedDoctor?.consultation_fee > 0 && process.env.REACT_APP_RAZORPAY_KEY_ID ? 'Book & Pay' : 'Confirm Booking'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ratings Dialog */}
      <Dialog open={!!ratingsDoctor} onOpenChange={(o) => !o && setRatingsDoctor(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reviews for {ratingsDoctor?.user?.name}</DialogTitle>
          </DialogHeader>
          {ratingsDoctor && <DoctorRatings doctorId={ratingsDoctor.id} />}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DoctorSearch;
