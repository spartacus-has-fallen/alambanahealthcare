import React, { useEffect, useState } from 'react';
import { Search, Stethoscope, Calendar, Star, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    appointment_type: 'online',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, specialtyFilter]);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors?approved_only=true');
      setDoctors(response.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;
    
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(doc => doc.specialization === specialtyFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        doctor_id: selectedDoctor.id,
        ...appointmentData
      });
      toast.success('Appointment booked successfully!');
      setDialogOpen(false);
      setAppointmentData({
        appointment_type: 'online',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to book appointment');
    }
  };

  const specialties = [...new Set(doctors.map(doc => doc.specialization))];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="doctor-search-page">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Doctors</h1>
          <p className="text-slate-600">Search and book consultations with verified healthcare professionals</p>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by doctor name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="doctor-search-input"
            />
          </div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger data-testid="specialty-filter">
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map(specialty => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Doctors List */}
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
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>{doctor.rating || 4.5}/5 ({doctor.total_consultations || 0} consultations)</span>
                    </div>
                    <p><strong>Qualification:</strong> {doctor.qualification}</p>
                    <p><strong>Experience:</strong> {doctor.experience_years} years</p>
                    <p className="text-primary font-semibold">₹{doctor.consultation_fee}</p>
                  </div>
                  
                  {doctor.bio && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doctor.bio}</p>
                  )}
                  
                  <Button
                    onClick={() => handleBookAppointment(doctor)}
                    className="w-full rounded-full bg-primary hover:bg-primary/90"
                    data-testid={`book-button-${idx}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment with {selectedDoctor?.user?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAppointment} className="space-y-4">
            <div>
              <Label>Consultation Type</Label>
              <Select
                value={appointmentData.appointment_type}
                onValueChange={(value) => setAppointmentData({...appointmentData, appointment_type: value})}
              >
                <SelectTrigger className="mt-2" data-testid="appointment-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Consultation</SelectItem>
                  <SelectItem value="offline">Offline Appointment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Appointment Date</Label>
              <Input
                type="date"
                value={appointmentData.appointment_date}
                onChange={(e) => setAppointmentData({...appointmentData, appointment_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
                className="mt-2"
                data-testid="appointment-date-input"
              />
            </div>

            <div>
              <Label>Appointment Time</Label>
              <Input
                type="time"
                value={appointmentData.appointment_time}
                onChange={(e) => setAppointmentData({...appointmentData, appointment_time: e.target.value})}
                required
                className="mt-2"
                data-testid="appointment-time-input"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={appointmentData.notes}
                onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                placeholder="Any specific concerns..."
                className="mt-2"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Consultation Fee</p>
              <p className="text-2xl font-bold text-primary">₹{selectedDoctor?.consultation_fee}</p>
            </div>

            <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90" data-testid="confirm-booking-button">
              Confirm Booking
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DoctorSearch;
