"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRedirectIfAuthenticated } from '@/hooks/useRequireAuth';
import { authService } from '@/services/auth';
import { toast } from '@/hooks/useToast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading: authLoading } = useRedirectIfAuthenticated('/dashboard');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await authService.signup({ name: data.name, email: data.email, password: data.password });
      toast({ title: 'Account created!', description: 'Please sign in with your new credentials.', variant: 'default' });
      router.replace('/auth/login');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast({ title: 'Email already in use', description: 'Try signing in instead.', variant: 'destructive' });
      } else if (status === 400 && message?.includes('HTML')) {
        toast({ title: 'Invalid input', description: 'Name cannot contain special characters.', variant: 'destructive' });
      } else {
        toast({ title: 'Signup failed', description: message || 'Something went wrong.', variant: 'destructive' });
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#0f172a]" />
          </div>
          <span className="text-white font-semibold text-lg">Docflow</span>
        </div>
        <div>
          <blockquote className="text-white/80 text-lg font-light leading-relaxed">
            &ldquo;Start writing. Your documents are always available — online or offline.&rdquo;
          </blockquote>
          <p className="text-white/40 mt-4 text-sm">Local-First Document Editor</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Docflow</span>
          </div>

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>Start your workspace in seconds</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form id="signup-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    {...register('name')}
                  />
                  {errors.name && <p role="alert" className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && <p role="alert" className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      aria-invalid={!!errors.password}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p role="alert" className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && <p role="alert" className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" form="signup-form" className="w-full" loading={isSubmitting}>
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="px-0 pt-0">
              <p className="text-sm text-muted-foreground text-center w-full">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-foreground font-medium hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
