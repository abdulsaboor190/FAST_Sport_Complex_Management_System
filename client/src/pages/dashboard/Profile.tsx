import { resolveImageUrl } from '@/config';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} from '@/store/api/profileApi';
import { updateUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const FAST_ID_REGEX = /^\d{2}[A-Za-z]-\d{4}$/;
const profileSchema = z.object({
  name: z.string().min(2).max(100),
  fastId: z.string().refine((v) => FAST_ID_REGEX.test(v.trim()), { message: 'Format: 23I-XXXX' }),
  email: z.string().email(),
});
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: profile, isLoading } = useGetProfileQuery(undefined, { skip: !user?.id });
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { name: profile.name, fastId: profile.fastId, email: profile.email }
      : undefined,
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const updated = await updateProfile(data).unwrap();
      dispatch(updateUser(updated));
      toast.success('Profile updated');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err && typeof (err as { data: { message?: string } }).data?.message === 'string'
          ? (err as { data: { message: string } }).data.message
          : 'Update failed';
      toast.error(msg);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }).unwrap();
      toast.success('Password updated');
      passwordForm.reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err && typeof (err as { data: { message?: string } }).data?.message === 'string'
          ? (err as { data: { message: string } }).data.message
          : 'Update failed';
      toast.error(msg);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await uploadAvatar(formData).unwrap();
      dispatch(updateUser({ avatarUrl: res.avatarUrl }));
      toast.success('Avatar updated');
    } catch {
      toast.error('Avatar upload failed');
    }
    e.target.value = '';
  };

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-8"
      >
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Account</h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">Manage your elite credentials</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left Column - Avatar and Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 lg:col-span-1"
        >
          <Card className="overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <div className="relative mx-auto mb-6 h-32 w-32">
                 <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />
                <div className="group relative h-full w-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <Avatar className="h-full w-full border-4 border-white/5 shadow-2xl">
                    <AvatarImage src={resolveImageUrl(profile.avatarUrl ?? undefined)} alt={profile.name} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-fast-primary to-fast-accent text-4xl font-black text-white">
                      {profile.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    {uploadingAvatar ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    ) : (
                      <Camera className="h-8 w-8 text-white scale-90 group-hover:scale-100 transition-transform" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">{profile.name}</h3>
              <p className="text-xs font-black uppercase tracking-widest text-fast-primary mt-1">{profile.role}</p>
              <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white/5 p-4 text-left">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#7a6a9a] uppercase tracking-wider">Status</span>
                  <span className="font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#7a6a9a] uppercase tracking-wider">Member Since</span>
                  <span className="font-bold text-white uppercase tracking-wider">2024</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Forms */}
        <div className="space-y-8 lg:col-span-2">
          {/* Personal Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl overflow-hidden">
               <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                 <CardTitle className="text-lg font-bold text-white">Security Settings</CardTitle>
                 <p className="text-xs text-[#7a6a9a] mt-1">Update your personal information and contact details.</p>
               </div>
               <CardContent className="p-8">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-[#7a6a9a]">Full Name</Label>
                      <Input id="name" {...profileForm.register('name')} className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50" />
                      {profileForm.formState.errors.name && (
                        <p className="text-xs font-bold text-red-400 mt-1">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fastId" className="text-[10px] uppercase font-black tracking-widest text-[#7a6a9a]">University ID</Label>
                      <Input id="fastId" {...profileForm.register('fastId')} className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50" />
                      {profileForm.formState.errors.fastId && (
                        <p className="text-xs font-bold text-red-400 mt-1">{profileForm.formState.errors.fastId.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-[#7a6a9a]">Email Address</Label>
                    <Input id="email" type="email" {...profileForm.register('email')} className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50" />
                    {profileForm.formState.errors.email && (
                      <p className="text-xs font-bold text-red-400 mt-1">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={updating} className="h-12 rounded-xl bg-gradient-to-r from-fast-primary to-fast-accent px-8 text-xs font-bold uppercase tracking-widest text-white shadow-xl hover:brightness-110 active:scale-95 transition-all">
                      {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {updating ? 'Processing...' : 'Save Profile Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl overflow-hidden">
               <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                 <CardTitle className="text-lg font-bold text-white">Password Management</CardTitle>
                 <p className="text-xs text-[#7a6a9a] mt-1">Ensure your account stays secure with a strong password.</p>
               </div>
               <CardContent className="p-8">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-[10px] uppercase font-black tracking-widest text-[#7a6a9a]">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      {...passwordForm.register('currentPassword')}
                      className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50 transition-all"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-xs font-bold text-red-400 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-[10px] uppercase font-black tracking-widest text-[#7a6a9a]">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        {...passwordForm.register('newPassword')}
                        className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50 transition-all"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-xs font-bold text-red-400 mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm" className="text-[10px] uppercase font-black tracking-widest text-[#7a6a9a]">Confirm New Password</Label>
                      <Input 
                        id="confirm" 
                        type="password" 
                        placeholder="••••••••"
                        {...passwordForm.register('confirm')} 
                        className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50 transition-all"
                      />
                      {passwordForm.formState.errors.confirm && (
                        <p className="text-xs font-bold text-red-400 mt-1">
                          {passwordForm.formState.errors.confirm.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={changingPassword} variant="outline" className="h-12 rounded-xl border-white/10 bg-white/5 px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 active:scale-95 transition-all">
                      {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {changingPassword ? 'Updating...' : 'Update Security Key'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
