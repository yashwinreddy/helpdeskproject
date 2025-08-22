import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Redirect } from 'wouter';
import type { Config } from '@shared/schema';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.78]);
  const [slaHours, setSlaHours] = useState(24);
  const [isDirty, setIsDirty] = useState(false);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/config'],
  });

  const updateConfigMutation = useMutation({
    mutationFn: (configUpdates: Partial<Config>) => api.updateConfig(configUpdates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
      setIsDirty(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  // Initialize form values when config loads
  useEffect(() => {
    if (config && !isDirty) {
      const configData = config as Config;
      setAutoCloseEnabled(configData.autoCloseEnabled);
      setConfidenceThreshold([configData.confidenceThreshold]);
      setSlaHours(configData.slaHours);
    }
  }, [config, isDirty]);

  const handleSave = () => {
    updateConfigMutation.mutate({
      autoCloseEnabled,
      confidenceThreshold: confidenceThreshold[0],
      slaHours,
    });
  };

  const handleAutoCloseToggle = (enabled: boolean) => {
    setAutoCloseEnabled(enabled);
    setIsDirty(true);
  };

  const handleThresholdChange = (value: number[]) => {
    setConfidenceThreshold(value);
    setIsDirty(true);
  };

  const handleSlaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlaHours(Number(e.target.value));
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-300 rounded-xl animate-pulse"></div>
          <div className="h-96 bg-gray-300 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="page-settings">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Settings</h2>
        <p className="text-gray-600" data-testid="text-page-description">Configure AI triage system parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Configuration */}
        <Card data-testid="card-ai-config">
          <CardHeader>
            <CardTitle>AI Triage Configuration</CardTitle>
            <p className="text-gray-600 text-sm">Adjust how the AI agent processes and resolves tickets</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700">Auto-Close Enabled</Label>
                <p className="text-xs text-gray-500">Allow AI to automatically resolve tickets</p>
              </div>
              <Switch
                checked={autoCloseEnabled}
                onCheckedChange={handleAutoCloseToggle}
                data-testid="switch-auto-close"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Threshold
              </Label>
              <div className="space-y-2">
                <Slider
                  value={confidenceThreshold}
                  onValueChange={handleThresholdChange}
                  max={1}
                  min={0}
                  step={0.01}
                  className="w-full"
                  data-testid="slider-confidence"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.0 (Low)</span>
                  <span className="font-medium text-gray-700" data-testid="text-threshold-value">
                    {confidenceThreshold[0].toFixed(2)}
                  </span>
                  <span>1.0 (High)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence score required for auto-resolution
              </p>
            </div>

            <div>
              <Label htmlFor="slaHours" className="block text-sm font-medium text-gray-700 mb-2">
                SLA Hours
              </Label>
              <Input
                id="slaHours"
                type="number"
                value={slaHours}
                onChange={handleSlaChange}
                min="1"
                max="168"
                className="w-full"
                data-testid="input-sla-hours"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hours before a ticket is marked as SLA breach
              </p>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                LLM Provider
              </Label>
              <Select defaultValue="stub" disabled>
                <SelectTrigger className="w-full" data-testid="select-llm-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stub">Stub Mode (Deterministic)</SelectItem>
                  <SelectItem value="openai-gpt4">OpenAI GPT-4</SelectItem>
                  <SelectItem value="openai-gpt3.5">OpenAI GPT-3.5</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <Button
                onClick={handleSave}
                disabled={!isDirty || updateConfigMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-save-config"
              >
                {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card data-testid="card-system-status">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <p className="text-gray-600 text-sm">Current system health and performance metrics</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3" data-testid="status-ai-service"></div>
                  <span className="text-sm font-medium text-gray-700">AI Agent Service</span>
                </div>
                <Badge className="bg-green-100 text-green-800" data-testid="badge-ai-status">
                  Operational
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3" data-testid="status-database"></div>
                  <span className="text-sm font-medium text-gray-700">Database</span>
                </div>
                <Badge className="bg-green-100 text-green-800" data-testid="badge-database-status">
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3" data-testid="status-queue"></div>
                  <span className="text-sm font-medium text-gray-700">Queue Processing</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-queue-status">
                  0 pending
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3" data-testid="status-email"></div>
                  <span className="text-sm font-medium text-gray-700">Email Service</span>
                </div>
                <Badge className="bg-green-100 text-green-800" data-testid="badge-email-status">
                  Active
                </Badge>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Response Time</p>
                  <p className="text-xl font-bold text-primary" data-testid="text-response-time">1.2s</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Success Rate</p>
                  <p className="text-xl font-bold text-green-600" data-testid="text-success-rate">99.8%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
