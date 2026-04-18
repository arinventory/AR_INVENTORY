
import React, { useState } from 'react';
import { Logo, UnderlineInput, Button, toast } from '../components/UIComponents';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'Login Failed', description: 'Username and password are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Query the users table specifically
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      // Unified failure message for both non-existent user and wrong password
      if (error || !user || password !== user.password_hash) {
        toast({ title: 'Authentication Error', description: 'invalid username or password.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Store safe user data in localStorage
      const userData = {
        id: user.id,
        username: user.username,
        role: user.role,
        staff_code: user.staff_code,
        can_edit_bills: user.can_edit_bills,
        can_edit_stock: user.can_edit_stock,
        can_authorize_nongst: user.can_authorize_nongst,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast({ title: 'Welcome Back', description: `Authenticated as ${user.role.toUpperCase()}` });
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      toast({ title: 'System Error', description: 'Failed to connect to authentication server.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-12 shadow-soft-gold rounded-sm border-[0.5px] border-gold-500/20 relative overflow-hidden shadow-2xl">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gold-100/50 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="mb-12">
          <Logo />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <UnderlineInput 
              label="Username" 
              placeholder="Enter your ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <UnderlineInput 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Authenticating...' : 'Enter System'}
            </Button>
            <p className="text-center mt-6 text-xs text-gold-600/60 font-serif italic">
              Restricted Access. Authorized Personnel Only.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
