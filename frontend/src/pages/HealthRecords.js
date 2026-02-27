import React, { useEffect, useState } from 'react';
import { Plus, Activity, FileHeart, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    record_type: 'weekly',
    date: new Date().toISOString().split('T')[0],
    weight: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    oxygen_level: '',
    sugar_level: '',
    heart_rate: '',
    notes: '',
    report_file_base64: '',
    report_file_name: ''
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/health-records');
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to load health records');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert empty strings to null
      const cleanedData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] === '') {
          cleanedData[key] = null;
        } else if (['weight', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'oxygen_level', 'sugar_level', 'heart_rate'].includes(key)) {
          cleanedData[key] = formData[key] ? parseFloat(formData[key]) : null;
        } else {
          cleanedData[key] = formData[key];
        }
      });

      await api.post('/health-records', cleanedData);
      toast.success('Health record added successfully');
      setDialogOpen(false);
      fetchRecords();
      // Reset form
      setFormData({
        record_type: 'weekly',
        date: new Date().toISOString().split('T')[0],
        weight: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        oxygen_level: '',
        sugar_level: '',
        heart_rate: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to add health record');
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await api.delete(`/health-records/${recordId}`);
      toast.success('Record deleted successfully');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  // Prepare chart data
  const chartData = records.slice(0, 10).reverse().map(record => ({
    date: record.date,
    weight: record.weight,
    heartRate: record.heart_rate,
    oxygen: record.oxygen_level,
    sugar: record.sugar_level
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="health-records-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Health Records</h1>
            <p className="text-slate-600">Track your vitals and health progress</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90" data-testid="add-record-dialog-button">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Health Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Record Type</Label>
                    <Select value={formData.record_type} onValueChange={(value) => setFormData({...formData, record_type: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="mt-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="70.5"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      value={formData.heart_rate}
                      onChange={(e) => setFormData({...formData, heart_rate: e.target.value})}
                      placeholder="72"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Blood Pressure (Systolic)</Label>
                    <Input
                      type="number"
                      value={formData.blood_pressure_systolic}
                      onChange={(e) => setFormData({...formData, blood_pressure_systolic: e.target.value})}
                      placeholder="120"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Blood Pressure (Diastolic)</Label>
                    <Input
                      type="number"
                      value={formData.blood_pressure_diastolic}
                      onChange={(e) => setFormData({...formData, blood_pressure_diastolic: e.target.value})}
                      placeholder="80"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Oxygen Level (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.oxygen_level}
                      onChange={(e) => setFormData({...formData, oxygen_level: e.target.value})}
                      placeholder="98"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Sugar Level (mg/dL)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.sugar_level}
                      onChange={(e) => setFormData({...formData, sugar_level: e.target.value})}
                      placeholder="100"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Upload Blood Report (Optional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            report_file_base64: reader.result.split(',')[1],
                            report_file_name: file.name
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-2"
                    data-testid="file-upload-input"
                  />
                  {formData.report_file_name && (
                    <p className="text-sm text-emerald-600 mt-1">✓ {formData.report_file_name}</p>
                  )}
                </div>

                <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90" data-testid="submit-record-button">
                  Save Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Health Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#0D9488" name="Weight (kg)" />
                    <Line type="monotone" dataKey="heartRate" stroke="#EF4444" name="Heart Rate" />
                    <Line type="monotone" dataKey="oxygen" stroke="#3B82F6" name="Oxygen (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileHeart className="h-5 w-5" />
              All Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No health records yet</p>
                <Button onClick={() => setDialogOpen(true)} variant="outline">
                  Add Your First Record
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, idx) => (
                  <div key={record.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`record-item-${idx}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                            {record.record_type}
                          </span>
                          <span className="text-sm text-slate-600">{record.date}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {record.weight && <div><span className="text-slate-500">Weight:</span> <strong>{record.weight} kg</strong></div>}
                          {record.heart_rate && <div><span className="text-slate-500">Heart Rate:</span> <strong>{record.heart_rate} bpm</strong></div>}
                          {record.blood_pressure_systolic && <div><span className="text-slate-500">BP:</span> <strong>{record.blood_pressure_systolic}/{record.blood_pressure_diastolic}</strong></div>}
                          {record.oxygen_level && <div><span className="text-slate-500">Oxygen:</span> <strong>{record.oxygen_level}%</strong></div>}
                          {record.sugar_level && <div><span className="text-slate-500">Sugar:</span> <strong>{record.sugar_level} mg/dL</strong></div>}
                        </div>
                        {record.notes && <p className="text-sm text-slate-600 mt-2">{record.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-record-${idx}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default HealthRecords;
