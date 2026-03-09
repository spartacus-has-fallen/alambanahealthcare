import React, { useState } from 'react';
import { AlertCircle, BrainCircuit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const AISymptomChecker = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setLoading(true);
    try {
      // Try with authentication, but fallback to unauthenticated if needed
      let response;
      try {
        response = await api.post('/ai/symptom-check', {
          symptoms,
          age: age ? parseInt(age) : null,
          gender: gender || null
        });
      } catch (authError) {
        // If authentication fails, try without token
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${BACKEND_URL}/api/ai/symptom-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms,
            age: age ? parseInt(age) : null,
            gender: gender || null
          })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        response = { data };
      }
      setResult(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'AI assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    const level = riskLevel?.toLowerCase();
    if (level === 'emergency' || level === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (level === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl py-12" data-testid="ai-symptom-checker">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">AI Symptom Checker</h1>
          <p className="text-slate-600 text-lg">Get preliminary health assessment powered by AI</p>
        </div>

        {/* Disclaimer */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Medical Disclaimer:</strong> This AI assessment is for informational purposes only and does not replace professional medical advice. 
              In case of emergency, contact your nearest hospital immediately.
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Describe Your Symptoms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="symptoms">Symptoms *</Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Please describe your symptoms in detail (e.g., fever for 2 days, headache, fatigue...)"
                rows={5}
                className="mt-2"
                data-testid="symptoms-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="mt-2"
                  data-testid="age-input"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender (optional)</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="mt-2" data-testid="gender-select">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCheck}
              disabled={loading}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90"
              data-testid="check-symptoms-button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                'Check Symptoms'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="animate-fade-in" data-testid="ai-result">
            <CardHeader>
              <CardTitle>AI Assessment Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Level */}
              <div>
                <Label className="text-sm text-slate-600">Risk Level</Label>
                <div className={`mt-2 px-4 py-3 rounded-lg border-2 font-semibold text-center ${getRiskColor(result.risk_level)}`}>
                  {result.risk_level}
                </div>
              </div>

              {/* Assessment */}
              <div>
                <Label className="text-sm text-slate-600">Assessment</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 whitespace-pre-wrap">{result.assessment}</p>
                </div>
              </div>

              {/* Suggested Specialist */}
              <div>
                <Label className="text-sm text-slate-600">Suggested Specialist</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between gap-4">
                  <p className="text-blue-700 font-medium">{result.suggested_specialist}</p>
                  <Button
                    size="sm"
                    className="rounded-full flex-shrink-0"
                    data-testid="book-specialist-btn"
                    onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(result.suggested_specialist)}`)}
                  >
                    Book Now →
                  </Button>
                </div>
              </div>

              {/* Lifestyle Advice */}
              {result.lifestyle_advice && (
                <div>
                  <Label className="text-sm text-slate-600">Lifestyle Advice</Label>
                  <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-emerald-700 whitespace-pre-wrap">{result.lifestyle_advice}</p>
                  </div>
                </div>
              )}

              {/* Emergency Alert */}
              {result.emergency_alert && (
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                    <AlertCircle className="h-5 w-5" />
                    EMERGENCY ALERT
                  </div>
                  <p className="text-red-600">Based on your symptoms, please seek immediate medical attention at the nearest hospital or call emergency services.</p>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => window.location.href = '/doctors'}
                className="w-full h-12 rounded-full bg-primary hover:bg-primary/90"
                data-testid="consult-doctor-button"
              >
                Consult a Doctor Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AISymptomChecker;
