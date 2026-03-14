import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetMyIssuesQuery } from '@/store/api/issueApi';
import type { IssueRef } from '@/store/api/issueApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageSquare, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: IssueRef['status'] }) {
  const configs = {
    Open: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertCircle },
    Acknowledged: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
    InProgress: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Clock },
    Resolved: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
    Closed: { color: 'text-[#7a6a9a] bg-white/5 border-white/5', icon: XCircle },
  };
  const config = (configs as any)[status] || configs.Open;
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest", config.color)}>
      <Icon className="h-3 w-3" />
      {status}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: IssueRef['priority'] }) {
  const colors = {
    Urgent: 'text-red-400 bg-red-400/10 border-red-400/20',
    High: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest", (colors as any)[priority])}>
      {priority}
    </span>
  );
}

export function MyIssues() {
  const { data: issues, isLoading } = useGetMyIssuesQuery();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10"
      >
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Maintenance Logs</h1>
          <p className="text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">Oversee reported anomalies and facility status</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/issues/new">
            <Button className="h-12 rounded-xl bg-fast-primary px-8 font-bold text-xs uppercase tracking-widest text-white shadow-xl hover:brightness-110 active:scale-95 transition-all">
              File New Report
            </Button>
          </Link>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : issues && issues.length ? (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 8 }}
              className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-[rgba(18,10,30,0.4)] p-6 shadow-xl backdrop-blur-md transition-all hover:bg-[rgba(18,10,30,0.6)] hover:border-fast-primary/20"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#7a6a9a] shrink-0">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-fast-primary transition-colors">{issue.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">
                      <span>{issue.category}</span>
                      <span className="h-1 text-1 rounded-full bg-white/20" />
                      <span>{format(new Date(issue.createdAt), 'PPp')}</span>
                      {issue.location && (
                        <>
                          <span className="h-1 text-1 rounded-full bg-white/20" />
                          <span className="text-white/60">{issue.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-16 md:ml-0">
                  <PriorityBadge priority={issue.priority} />
                  <StatusBadge status={issue.status} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-dashed border-white/10 bg-transparent py-24">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <AlertCircle className="h-10 w-10 text-[#7a6a9a]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Zero Anomalies</h3>
              <p className="text-sm text-[#7a6a9a] max-w-sm">Everything seems to be operating at peak efficiency. No issues found in your log.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
