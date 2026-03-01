import React, { useEffect, useState } from 'react';
import { Settings, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/utils/api';
import { toast } from 'sonner';

const IntegrationControlPanel = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await api.get('/admin/feature-flags');
      setFeatures(response.data);
    } catch (error) {
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId, currentStatus) => {
    try {
      await api.put(`/admin/feature-flags/${featureId}`, {
        is_enabled: !currentStatus
      });
      toast.success('Feature flag updated successfully');
      fetchFeatures();
    } catch (error) {
      toast.error('Failed to update feature flag');
    }
  };

  const getStatusColor = (isEnabled) => {
    return isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8" data-testid="integration-control-panel">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Integration Control Panel</h1>
          </div>
          <p className="text-slate-600">Manage paid integrations and future features</p>
        </div>

        {/* Warning Card */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="p-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Important:</strong> Enabling paid integrations will activate third-party services that may incur costs. 
              Make sure to configure API keys and credentials before enabling any feature. 
              All features are OFF by default to prevent unexpected charges.
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        {loading ? (
          <p className="text-center py-12">Loading integrations...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <Card key={feature.id} className="hover:shadow-md transition-shadow" data-testid={`feature-card-${idx}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{feature.display_name}</CardTitle>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                    <Switch
                      checked={feature.is_enabled}
                      onCheckedChange={() => toggleFeature(feature.id, feature.is_enabled)}
                      data-testid={`toggle-${feature.feature_name}`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(feature.is_enabled)}`}>
                        {feature.is_enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Estimated Cost:</span>
                      <span className="text-sm font-semibold">{feature.estimated_cost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Last Modified:</span>
                      <span className="text-xs text-slate-500">
                        {new Date(feature.last_modified).toLocaleDateString()}
                      </span>
                    </div>
                    {!feature.is_enabled && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                        Coming Soon - Feature is prepared but not consuming any paid services
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Configuration Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold mb-2">How to Enable a Feature:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Obtain API credentials from the respective service provider</li>
                  <li>Add credentials to backend environment variables (.env file)</li>
                  <li>Toggle the feature switch to ON</li>
                  <li>Test the integration thoroughly</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Billing Protection:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>No API calls are made when a feature is OFF</li>
                  <li>No recurring billing is triggered automatically</li>
                  <li>You maintain full control over what gets activated</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg">
                <p className="font-semibold mb-2">Need Help?</p>
                <p>Contact support at: <a href="tel:8084161465" className="text-primary hover:underline">8084161465</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default IntegrationControlPanel;
