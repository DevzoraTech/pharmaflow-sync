import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LoginFormProps {
  onLoginSuccess: (user: unknown) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PHARMACIST');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
            role
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm sm:text-base">G</span>
            </div>
            <span className="text-lg sm:text-xl font-semibold">Green Leaf</span>
          </div>
          <CardTitle className="text-lg sm:text-xl">Welcome to Green Leaf</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sign in or create an account to access the pharmacy management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="login" className="text-xs sm:text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive" className="text-xs sm:text-sm">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-9 sm:h-10 text-sm" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-name" className="text-xs sm:text-sm">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-email" className="text-xs sm:text-sm">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-9 sm:h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="h-9 sm:h-10 text-sm"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="role" className="text-xs sm:text-sm">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 h-9 sm:h-10 text-sm border border-input bg-background rounded-md"
                  >
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="CASHIER">Cashier</option>
                  </select>
                </div>
                
                {error && (
                  <Alert variant="destructive" className="text-xs sm:text-sm">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-9 sm:h-10 text-sm" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}