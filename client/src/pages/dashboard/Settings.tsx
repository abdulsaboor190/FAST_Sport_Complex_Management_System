import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Shield, 
  Eye, 
  Smartphone, 
  Globe, 
  Moon, 
  Database,
  Search,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function Settings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [amoledMode, setAmoledMode] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);

  const handleSave = () => {
    toast.success('Settings synchronized successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-8"
      >
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Settings</h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">Configure your premium experience</p>
        </div>
        <Button onClick={handleSave} className="bg-fast-primary text-white font-bold uppercase tracking-widest px-8 rounded-xl shadow-[0_10px_20px_rgba(168,85,247,0.2)] hover:scale-105 transition-all">
           Save Everything
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl overflow-hidden">
             <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                   <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">Notifications</CardTitle>
                  <p className="text-[10px] text-[#7a6a9a] font-black uppercase tracking-widest mt-0.5">Alert preferences</p>
                </div>
             </div>
             <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-white">Email Alerts</Label>
                    <p className="text-xs text-[#7a6a9a]">Receive booking confirmations via email.</p>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>
                <div className="h-[1px] bg-white/5" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-white">Push Notifications</Label>
                    <p className="text-xs text-[#7a6a9a]">Alerts for tournament brackets and events.</p>
                  </div>
                  <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* Display & UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl overflow-hidden">
             <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-fast-primary/20 flex items-center justify-center text-fast-primary">
                   <Eye className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">Interface</CardTitle>
                  <p className="text-[10px] text-[#7a6a9a] font-black uppercase tracking-widest mt-0.5">Visual settings</p>
                </div>
             </div>
             <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-white">AMOLED Dark Mode</Label>
                    <p className="text-xs text-[#7a6a9a]">Pitch black backgrounds for OLED screens.</p>
                  </div>
                  <Switch checked={amoledMode} onCheckedChange={setAmoledMode} />
                </div>
                <div className="h-[1px] bg-white/5" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-white">Low Data Mode</Label>
                    <p className="text-xs text-[#7a6a9a]">Reduce image quality to save bandwidth.</p>
                  </div>
                  <Switch checked={lowDataMode} onCheckedChange={setLowDataMode} />
                </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card className="border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl overflow-hidden">
             <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                   <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">Privacy & Compliance</CardTitle>
                  <p className="text-[10px] text-[#7a6a9a] font-black uppercase tracking-widest mt-0.5">Data management</p>
                </div>
             </div>
             <CardContent className="p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                           <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                           <h4 className="text-sm font-bold text-white">Data Portability</h4>
                        </div>
                        <p className="text-xs text-[#7a6a9a] mb-4">Download a copy of your bookings and personal activity data.</p>
                        <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-white/10 bg-white/5">Export My Data</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                           <Info className="h-4 w-4 text-blue-400" />
                           <h4 className="text-sm font-bold text-white">Session Control</h4>
                        </div>
                        <p className="text-xs text-[#7a6a9a] mb-4">You are currently logged in from 1 device in Islamabad, PK.</p>
                        <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-white/10 bg-white/5">Clear All Sessions</Button>
                    </div>
                  </div>
               </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* Language & Regional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2"
        >
          <Card className="border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl overflow-hidden">
             <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Language & Region</h4>
                    <p className="text-xs text-[#7a6a9a]">English (United States) · UTC+05:00</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-xs font-bold text-fast-primary">Change Region <ChevronRight className="ml-2 h-4 w-4" /></Button>
             </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="text-center pt-8 border-t border-white/5">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">FSCM CORE v2.4.0 · BUILD_PROD_992</p>
      </div>
    </div>
  );
}
