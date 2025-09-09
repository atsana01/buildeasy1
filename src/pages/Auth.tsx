import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuoteForm } from '@/contexts/QuoteFormContext';
import { toast } from '@/hooks/use-toast';
import { Home, Mail, Lock, User, Building, ArrowLeft } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const baseSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  userType: z.enum(['client', 'vendor']),
  companyName: z.string().optional(),
  vatId: z.string().optional(),
  businessAddress: z.string().optional(),
  phoneNumber: z.string().optional(),
  businessName: z.string().optional(),
});

const signupSchema = baseSignupSchema.refine((data) => {
  if (data.userType === 'vendor') {
    return data.businessName && data.vatId && data.businessAddress;
  }
  return true;
}, {
  message: "Business name, VAT ID, and business address are required for vendors",
  path: ["businessName"]
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setWasRedirectedFromAuth, wasRedirectedFromAuth } = useQuoteForm();
  const [loading, setLoading] = useState(false);
  const initialUserType = searchParams.get('type') === 'vendor' ? 'vendor' : 'client';
  const redirectParam = searchParams.get('redirect');

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      email: '', 
      password: '', 
      fullName: '', 
      userType: initialUserType,
      companyName: '',
      vatId: '',
      businessAddress: '',
      phoneNumber: '',
      businessName: ''
    }
  });

  useEffect(() => {
    const redirectUser = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', user.id)
            .single();
          
          // Validate user type matches the auth context
          const userType = data?.user_type;
          
          // Prevent clients from accessing vendor areas and vice versa
          if (initialUserType === 'vendor' && userType === 'client') {
            toast({
              title: 'Access Denied',
              description: 'You cannot access vendor areas with a client account.',
              variant: 'destructive'
            });
            navigate('/dashboard');
            return;
          }
          
          if (initialUserType === 'client' && userType === 'vendor') {
            toast({
              title: 'Access Denied', 
              description: 'You cannot access client areas with a vendor account.',
              variant: 'destructive'
            });
            navigate('/vendor-dashboard');
            return;
          }
          
          // Redirect based on context
          if (redirectParam === 'quote' || wasRedirectedFromAuth) {
            // User was redirected from quote flow
            if (userType === 'client') {
              navigate('/');
            } else {
              navigate('/vendor-dashboard');
            }
          } else {
            // Normal login redirect
            if (userType === 'vendor') {
              navigate('/vendor-dashboard');
            } else {
              navigate('/dashboard');
            }
          }
        } catch (error) {
          navigate('/dashboard');
        }
      }
    };

    redirectUser();
  }, [user, navigate, initialUserType, redirectParam, wasRedirectedFromAuth]);

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      // Check user type matches expected type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (profile && initialUserType !== profile.user_type) {
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: `This account is registered as a ${profile.user_type}. Please use the correct login option.`,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      toast({ title: 'Welcome back!', description: 'You have been signed in successfully.' });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      // Store auth redirect state if coming from quote flow
      if (redirectParam === 'quote') {
        setWasRedirectedFromAuth(true);
      }
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
            user_type: data.userType,
            company_name: data.companyName || null,
            phone_number: data.phoneNumber || null,
            vat_id: data.vatId || null,
            business_address: data.businessAddress || null,
            business_name: data.businessName || null,
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (userType: 'client' | 'vendor') => {
    setLoading(true);
    try {
      // Store auth redirect state if coming from quote flow
      if (redirectParam === 'quote') {
        setWasRedirectedFromAuth(true);
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            user_type: userType,
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Google sign-in failed',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async (data: { email: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: 'Password reset email sent!',
        description: 'Check your inbox for the reset link.',
      });
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to previous page
          </Button>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <img src="/lovable-uploads/569809aa-baff-4dfd-a37e-09697c885f6d.png" alt="BuildEasy Logo" className="h-32 w-auto object-contain" />
        </div>

        <Card className="shadow-elegant bg-white/90 backdrop-blur-sm border border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>

                <div className="text-center mb-4">
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => handleForgotPassword({ email: loginForm.getValues('email') })}
                    className="text-sm"
                    disabled={!loginForm.getValues('email') || loading}
                  >
                    Forgot password?
                  </Button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGoogleSignIn('client')}
                    disabled={loading}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Continue as Client with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGoogleSignIn('vendor')}
                    disabled={loading}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Continue as Vendor with Google
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="userType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="client" id="client" />
                                <Label htmlFor="client">Client</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="vendor" id="vendor" />
                                <Label htmlFor="vendor">Vendor</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {signupForm.watch('userType') === 'vendor' && (
                      <div className="space-y-4">
                        <FormField
                          control={signupForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Business Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={signupForm.control}
                          name="vatId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT ID *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your VAT ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={signupForm.control}
                          name="businessAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Business Address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={signupForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Phone Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;