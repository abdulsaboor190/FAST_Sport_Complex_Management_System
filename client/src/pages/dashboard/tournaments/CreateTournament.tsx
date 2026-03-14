import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateTournamentMutation } from '@/store/api/tournamentApi';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Trophy, Target, Calendar, Users, DollarSign, Terminal, ShieldAlert, Lock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(3, "Mission name must be at least 3 characters"),
    sport: z.string().min(2, "Combat sport is required"),
    startDate: z.string().min(1, "Commencement date required"),
    endDate: z.string().min(1, "Termination date required"),
    format: z.enum(['SingleElimination', 'DoubleElimination', 'RoundRobin', 'GroupStage']),
    maxTeams: z.coerce.number().int().min(2).max(128).default(16),
    entryFee: z.coerce.number().min(0).default(0),
    rules: z.string().min(10, "Tactical rules must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateTournament() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const user = useAppSelector((state) => state.auth.user);
    const [createTournament, { isLoading }] = useCreateTournamentMutation();

    useEffect(() => {
        // Only redirect if user is loaded and NOT an admin
        if (user && user.role !== 'Admin') {
            toast.error('Sector Restricted: Administrative Clearance Required');
            navigate('/dashboard/tournaments');
        }
    }, [user, navigate]);

    const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            format: 'SingleElimination',
            maxTeams: 16,
            entryFee: 0,
        }
    });

    const onSubmit = async (data: FormData) => {
        if (user?.role !== 'Admin') {
            toast.error('Protocol Denied: Insufficient Clearance');
            return;
        }

        try {
            await createTournament({
                ...data,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
            }).unwrap();
            toast.success('Tournament Protocol Initialized');
            navigate('/dashboard/tournaments');
        } catch (error: any) {
            const message = error?.data?.message || 'Initialization Failed';
            toast.error(message);
            console.error(error);
        }
    };

    const nextStep = async () => {
        let fields: (keyof FormData)[] = [];
        if (step === 1) fields = ['name', 'sport', 'rules'];
        else if (step === 2) fields = ['format', 'maxTeams', 'entryFee', 'startDate', 'endDate'];

        const valid = await trigger(fields);
        if (valid) setStep(s => s + 1);
    };

    // Handle Loading State
    if (!user) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-fast-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a6a9a]">Verifying Identity Clearance...</p>
            </div>
        );
    }

    // Handle Unauthorized State (should be handled by useEffect but as a backup)
    if (user.role !== 'Admin') {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                    <div className="relative h-24 w-24 rounded-[32px] bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-2xl">
                        <Lock className="h-10 w-10 text-red-500" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase italic">Access Denied</h3>
                    <p className="text-sm font-medium text-[#7a6a9a] uppercase tracking-widest">Sector Clearance: Administrative Only</p>
                </div>
                <Button onClick={() => navigate('/dashboard/tournaments')} className="bg-white text-black font-black uppercase tracking-widest px-8 h-12 rounded-xl">
                    Return to Arena
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 py-10">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-6">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate('/dashboard/tournaments')}
                        className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-4xl font-black tracking-tight text-white uppercase italic">Forge Arena</h1>
                        <p className="text-xs font-bold tracking-[0.3em] text-fast-primary uppercase">Protocol Initialization Phase {step}/3</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className={cn(
                                "h-1.5 w-12 rounded-full transition-all duration-500",
                                step >= i ? "bg-fast-primary shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-white/10"
                            )} 
                        />
                    ))}
                </div>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="relative">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            <Card className="overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-3xl rounded-[32px]">
                                <CardContent className="p-8 md:p-12 space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="h-10 w-10 rounded-xl bg-fast-primary/20 flex items-center justify-center border border-fast-primary/30">
                                            <Terminal className="h-5 w-5 text-fast-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Strategic Identity</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Basic Protocol Metadata</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Mission Codename</Label>
                                            <Input 
                                                className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 font-bold text-white focus:border-fast-primary/50 focus:ring-fast-primary/20 transition-all"
                                                {...register('name')} 
                                                placeholder="e.g. OPERATION: RED LINE" 
                                            />
                                            {errors.name && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.name.message}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Combat Sector (Sport)</Label>
                                            <div className="relative group">
                                                <select
                                                    className="w-full h-14 rounded-2xl border border-white/5 bg-[#120a1e] px-6 text-sm font-bold text-white focus:ring-2 focus:ring-fast-primary/20 appearance-none outline-none transition-all"
                                                    {...register('sport')}
                                                >
                                                    <option value="">SELECT SECTOR</option>
                                                    <option value="Football">FOOTBALL ARENA</option>
                                                    <option value="Cricket">CRICKET GROUND</option>
                                                    <option value="Badminton">BADMINTON COURT</option>
                                                    <option value="Basketball">BASKETBALL COMPLEX</option>
                                                    <option value="Table Tennis">TABLE TENNIS LAB</option>
                                                </select>
                                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7a6a9a] rotate-90 pointer-events-none" />
                                            </div>
                                            {errors.sport && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.sport.message}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Tactical Rules & Mandates</Label>
                                            <Textarea 
                                                className="min-h-[160px] rounded-2xl border-white/5 bg-white/5 p-6 font-bold text-white focus:border-fast-primary/50 focus:ring-fast-primary/20 transition-all resize-none"
                                                {...register('rules')} 
                                                placeholder="Define the engagement protocols, eligibility, and disciplinary actions..." 
                                            />
                                            {errors.rules && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.rules.message}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-3xl rounded-[32px]">
                                <CardContent className="p-8 md:p-12 space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <Target className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Engagement Logistics</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Deployment Constraints</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Combat Format</Label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full h-14 rounded-2xl border border-white/5 bg-[#120a1e] px-6 text-sm font-bold text-white focus:ring-2 focus:ring-fast-primary/20 appearance-none outline-none"
                                                        {...register('format')}
                                                    >
                                                        <option value="SingleElimination">SINGLE ELIMINATION</option>
                                                        <option value="DoubleElimination">DOUBLE ELIMINATION</option>
                                                        <option value="RoundRobin">ROUND ROBIN</option>
                                                        <option value="GroupStage">GROUP STAGE</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7a6a9a] rotate-90 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Authorized Units (Max Teams)</Label>
                                                <div className="relative">
                                                    <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7a6a9a]" />
                                                    <Input type="number" className="h-14 rounded-2xl border-white/5 bg-white/5 pl-14 font-bold text-white" {...register('maxTeams')} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Access Credit (Entry Fee)</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7a6a9a]" />
                                                    <Input type="number" className="h-14 rounded-2xl border-white/5 bg-white/5 pl-14 font-bold text-white" {...register('entryFee')} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Infiltration Date (Start)</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7a6a9a]" />
                                                    <Input type="datetime-local" className="h-14 rounded-2xl border-white/5 bg-white/5 pl-14 font-bold text-white color-scheme-dark" {...register('startDate')} />
                                                </div>
                                                {errors.startDate && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.startDate.message}</p>}
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] ml-1">Exfiltration Date (End)</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7a6a9a]" />
                                                    <Input type="datetime-local" className="h-14 rounded-2xl border-white/5 bg-white/5 pl-14 font-bold text-white color-scheme-dark" {...register('endDate')} />
                                                </div>
                                                {errors.endDate && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1">{errors.endDate.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-3xl rounded-[32px]">
                                <CardContent className="p-8 md:p-12 space-y-10">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="relative">
                                           <div className="absolute inset-0 bg-fast-primary/20 blur-2xl rounded-full" />
                                           <div className="relative h-20 w-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                                              <ShieldAlert className="h-10 w-10 text-fast-primary" />
                                           </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase italic">Protocol Finalization</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Verify mission parameters before broadcast</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Operation</span>
                                            <p className="text-sm font-bold text-white truncate">{watch('name')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Sector</span>
                                            <p className="text-sm font-bold text-white">{watch('sport')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Units</span>
                                            <p className="text-sm font-bold text-white">{watch('maxTeams')} Teams</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Access</span>
                                            <p className="text-sm font-bold text-white">{watch('entryFee')} PKR</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                          All tactical systems operational
                                       </div>
                                       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                          Arena power levels stabilized
                                       </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-10">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setStep(s => Math.max(1, s - 1))} 
                        disabled={step === 1}
                        className="h-14 px-10 rounded-2xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] hover:text-white transition-all disabled:opacity-30"
                    >
                        PREVIOUS PHASE
                    </Button>

                    {step < 3 ? (
                        <Button 
                            type="button" 
                            onClick={nextStep}
                            className="h-14 px-10 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-[0_15px_30px_rgba(255,255,255,0.1)] hover:scale-105 transition-all"
                        >
                            NEXT PHASE <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="h-14 px-10 rounded-2xl bg-fast-primary text-white text-[10px] font-black uppercase tracking-widest shadow-[0_15px_30px_rgba(168,85,247,0.3)] hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'INITIALIZING...' : 'INITIALIZE PROTOCOL'}
                        </Button>
                    )}
                </div>
            </form>

            <style>{`
                .color-scheme-dark {
                    color-scheme: dark;
                }
            `}</style>
        </div>
    );
}
