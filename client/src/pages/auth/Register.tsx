import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAppDispatch } from '@/store/hooks';
import { useRegisterMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

const FAST_ID_REGEX = /^\d{2}[A-Za-z]-\d{4}$/;

const schema = z.object({
  fastId: z.string().refine((v) => FAST_ID_REGEX.test(v.trim()), {
    message: 'Use format 23I-XXXX (e.g. 23I-0545)',
  }),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  name: z.string().min(2, 'Name required'),
  role: z.enum(['Student', 'Faculty', 'Coach', 'Admin']).default('Student'),
});

type FormData = z.infer<typeof schema>;

export function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'Student' } });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await registerUser({
        fastId: data.fastId.trim().toUpperCase(),
        email: data.email,
        password: data.password,
        name: data.name.trim(),
        role: data.role,
      }).unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: res.accessToken }));
      toast.success('Induction Complete. Welcome to the Network.');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'data' in err && typeof (err as { data: { message?: string } }).data?.message === 'string'
        ? (err as { data: { message: string } }).data.message
        : 'Induction Failed. Validation Error.';
      toast.error(message);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0d0814] overflow-hidden py-20">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-fast-accent/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fast-primary/10 blur-[120px] rounded-full" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150" />
         <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        <div className="mb-12 text-center space-y-3">
            <motion.div 
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="relative group overflow-hidden h-20 w-20 mx-auto rounded-[28px] p-2 bg-white/5 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-transform hover:scale-110 active:scale-95"
            >
               <img src="/logo.png" className="h-full w-full object-contain brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" alt="Logo" />
            </motion.div>
           <h1 className="font-display text-4xl font-black tracking-tighter text-white uppercase italic">Induction Portal</h1>
           <p className="text-sm font-medium tracking-widest text-[#7a6a9a] uppercase">Register New Personnel Identity</p>
        </div>

        <Card className="overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl rounded-[48px] p-2">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
          <CardContent className="relative p-10 md:p-14">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <Label htmlFor="fastId" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">FAST Identifier</Label>
                    <Input
                      id="fastId"
                      placeholder="23I-0545"
                      className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 font-bold text-white placeholder:text-white/20 transition-all focus:border-fast-primary/50 focus:ring-fast-primary/20"
                      {...register('fastId')}
                    />
                    {errors.fastId && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.fastId.message}</motion.p>
                    )}
                 </div>

                 <div className="space-y-3">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Full Designation (Name)</Label>
                    <Input
                      id="name"
                      placeholder="Operational Name"
                      className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 font-bold text-white placeholder:text-white/20 transition-all focus:border-fast-primary/50 focus:ring-fast-primary/20"
                      {...register('name')}
                    />
                    {errors.name && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.name.message}</motion.p>
                    )}
                 </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Comm Channel (Email)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@nu.edu.pk"
                  className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 font-bold text-white placeholder:text-white/20 transition-all focus:border-fast-primary/50 focus:ring-fast-primary/20"
                  {...register('email')}
                />
                {errors.email && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.email.message}</motion.p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Secure Key</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 font-bold text-white placeholder:text-white/20 transition-all focus:border-fast-primary/50 focus:ring-fast-primary/20"
                      {...register('password')}
                    />
                    {errors.password && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.password.message}</motion.p>
                    )}
                 </div>

                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Sector Role</Label>
                    <select
                      className="flex h-14 w-full rounded-2xl border-white/5 bg-[#1a1228] px-6 text-sm font-bold text-white focus:ring-2 focus:ring-fast-primary/20 appearance-none outline-none"
                      {...register('role')}
                    >
                      <option value="Student">Student Operative</option>
                      <option value="Faculty">Faculty Command</option>
                      <option value="Coach">Tactical Coach</option>
                      <option value="Admin">System Administrator</option>
                    </select>
                 </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>Processing Induction...</span>
                  </div>
                ) : (
                  'Confirm Personnel Induction'
                )}
              </Button>
            </form>

            <div className="mt-12 flex flex-col items-center gap-6">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a]">
                 Already Inducted?{' '}
                 <Link to="/login" className="text-white hover:text-fast-primary transition-colors underline underline-offset-4 decoration-white/20">
                   Access Terminal
                 </Link>
               </p>
               <div className="h-[1px] w-full bg-white/5" />
               <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] hover:text-white transition-colors">
                 Abort Induction Protocol
               </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
