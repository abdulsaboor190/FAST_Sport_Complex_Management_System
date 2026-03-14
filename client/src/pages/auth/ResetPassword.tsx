import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useResetPasswordMutation } from '@/store/api/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });
type FormData = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }
    try {
      await resetPassword({ token, password: data.password }).unwrap();
      toast.success('Password updated. You can log in now.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'data' in err && typeof (err as { data: { message?: string } }).data?.message === 'string'
        ? (err as { data: { message: string } }).data.message
        : 'Reset failed';
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fast-light/50 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-fast-primary">Set new password</CardTitle>
            <p className="text-sm text-muted-foreground">Choose a strong password</p>
          </CardHeader>
          <CardContent>
            {!token ? (
              <p className="text-center text-sm text-destructive">
                Invalid or missing reset link. Request a new one from the login page.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirm')}
                  />
                  {errors.confirm && (
                    <p className="text-sm text-destructive">{errors.confirm.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-fast-primary hover:underline">Back to login</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
