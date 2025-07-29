import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsData {
  // General Settings
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  
  // User Profile
  userName: string;
  userEmail: string;
  role: string;
  
  // Notifications
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  // Security
  twoFactorAuth: boolean;
  autoLogout: boolean;
  sessionTimeout: number;
  
  // System Settings
  currency: string;
  timezone: string;
  dateFormat: string;
  automaticBackups: boolean;
  
  // Appearance
  darkMode: boolean;
  language: string;
  itemsPerPage: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    // General Settings
    pharmacyName: "Green Leaf Pharmacy",
    address: "123 Main Street, Kampala, Uganda",
    phone: "+256 700 123 456",
    email: "info@greenleaf.com",
    
    // User Profile
    userName: "John Pharmacist",
    userEmail: "john@greenleaf.com",
    role: "Pharmacist",
    
    // Notifications
    lowStockAlerts: true,
    expiryAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
    
    // Security
    twoFactorAuth: false,
    autoLogout: true,
    sessionTimeout: 30,
    
    // System Settings
    currency: "UGX",
    timezone: "Africa/Kampala",
    dateFormat: "DD/MM/YYYY",
    automaticBackups: true,
    
    // Appearance
    darkMode: false,
    language: "English",
    itemsPerPage: 25
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load settings from localStorage first (fallback)
      const savedSettings = localStorage.getItem('pharmacy-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      // Update user profile from Supabase
      const { data: userProfile } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('auth_id', user.id)
        .single();

      if (userProfile) {
        setSettings(prev => ({
          ...prev,
          userName: userProfile.name || prev.userName,
          userEmail: userProfile.email || prev.userEmail,
          role: userProfile.role || prev.role
        }));
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      // Save to localStorage
      localStorage.setItem('pharmacy-settings', JSON.stringify(settings));

      // Try to update user profile in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({
            name: settings.userName,
            email: settings.userEmail
          })
          .eq('auth_id', user.id);
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading settings...</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your Green Leaf Pharmacy system preferences</p>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacyName">Pharmacy Name</Label>
              <Input 
                id="pharmacyName" 
                value={settings.pharmacyName}
                onChange={(e) => updateSetting('pharmacyName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={settings.address}
                onChange={(e) => updateSetting('address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={settings.phone}
                onChange={(e) => updateSetting('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={settings.email}
                onChange={(e) => updateSetting('email', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Full Name</Label>
              <Input 
                id="userName" 
                value={settings.userName}
                onChange={(e) => updateSetting('userName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input 
                id="userEmail" 
                type="email" 
                value={settings.userEmail}
                onChange={(e) => updateSetting('userEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={settings.role} disabled />
            </div>
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when items are low in stock</p>
              </div>
              <Switch 
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => updateSetting('lowStockAlerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified about expiring medicines</p>
              </div>
              <Switch 
                checked={settings.expiryAlerts}
                onCheckedChange={(checked) => updateSetting('expiryAlerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
              </div>
              <Switch 
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch 
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Logout</Label>
                <p className="text-sm text-muted-foreground">Automatically logout after inactivity</p>
              </div>
              <Switch 
                checked={settings.autoLogout}
                onCheckedChange={(checked) => updateSetting('autoLogout', checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input 
                id="sessionTimeout" 
                type="number" 
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Input 
                id="currency" 
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input 
                id="timezone" 
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input 
                id="dateFormat" 
                value={settings.dateFormat}
                onChange={(e) => updateSetting('dateFormat', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">Daily system backups</p>
              </div>
              <Switch 
                checked={settings.automaticBackups}
                onCheckedChange={(checked) => updateSetting('automaticBackups', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch to dark theme</p>
              </div>
              <Switch 
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting('darkMode', checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input 
                id="language" 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemsPerPage">Items Per Page</Label>
              <Input 
                id="itemsPerPage" 
                type="number" 
                value={settings.itemsPerPage}
                onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value) || 25)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          className="gap-2" 
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}