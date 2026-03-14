import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetMaintenanceListQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useGetEquipmentQuery,
} from '@/store/api/equipmentApi';
import type { MaintenanceTaskType, MaintenanceTaskStatus } from '@/store/api/equipmentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Wrench, Plus, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';

const typeLabels: Record<MaintenanceTaskType, string> = {
  RoutineInspection: 'Routine inspection',
  Repair: 'Repair',
  DeepCleaning: 'Deep cleaning',
  Replacement: 'Replacement',
};
const statusColors: Record<MaintenanceTaskStatus, string> = {
  Planned: 'bg-slate-500/90',
  InProgress: 'bg-amber-500/90',
  Completed: 'bg-emerald-500/90',
  Cancelled: 'bg-muted',
};

const createSchema = z.object({
  equipmentId: z.string().min(1),
  type: z.enum(['RoutineInspection', 'Repair', 'DeepCleaning', 'Replacement']),
  scheduledFor: z.string().min(1),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export function EquipmentMaintenance() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const [showCreate, setShowCreate] = useState(false);
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const { data: tasks, isLoading } = useGetMaintenanceListQuery({
    from: monthStart.toISOString(),
    to: monthEnd.toISOString(),
  });
  const { data: equipment } = useGetEquipmentQuery({});
  const [createTask, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateTask] = useUpdateMaintenanceMutation();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      equipmentId: '',
      type: 'RoutineInspection',
      scheduledFor: '',
      assignedTo: '',
      notes: '',
    },
  });

  const onCreate = form.handleSubmit(async (data) => {
    try {
      await createTask({
        equipmentId: data.equipmentId,
        type: data.type as MaintenanceTaskType,
        scheduledFor: new Date(data.scheduledFor).toISOString(),
        assignedTo: data.assignedTo || undefined,
        notes: data.notes || undefined,
      }).unwrap();
      toast.success('Maintenance task created');
      setShowCreate(false);
      form.reset();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed to create');
    }
  });

  const markComplete = async (id: string) => {
    try {
      await updateTask({ id, status: 'Completed' }).unwrap();
      toast.success('Marked complete');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/equipment">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
            <p className="text-muted-foreground">Scheduled maintenance for {format(monthStart, 'MMMM yyyy')}</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        )}
      </div>

      {showCreate && isAdmin && (
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">New maintenance task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-3">
              <label className="block text-sm font-medium">Equipment</label>
              <select
                {...form.register('equipmentId')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select equipment</option>
                {equipment?.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.category?.name})</option>
                ))}
              </select>
              {form.formState.errors.equipmentId && (
                <p className="text-sm text-destructive">{form.formState.errors.equipmentId.message}</p>
              )}
              <label className="block text-sm font-medium">Type</label>
              <select
                {...form.register('type')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {(Object.keys(typeLabels) as MaintenanceTaskType[]).map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
              <label className="block text-sm font-medium">Scheduled for</label>
              <input
                type="datetime-local"
                {...form.register('scheduledFor')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              {form.formState.errors.scheduledFor && (
                <p className="text-sm text-destructive">{form.formState.errors.scheduledFor.message}</p>
              )}
              <input
                placeholder="Assigned to (optional)"
                {...form.register('assignedTo')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Notes (optional)"
                {...form.register('notes')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card className="border-border/50 bg-card shadow-sm">
          <CardContent className="pt-6">
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : !tasks?.length ? (
        <Card className="border-border/50 bg-card shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No maintenance tasks this month.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">{task.equipment?.name ?? 'Equipment'}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeLabels[task.type]} · {task.equipment?.category?.name ?? ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(task.scheduledFor), 'PPp')}
                      {task.assignedTo && ` · ${task.assignedTo}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[task.status]}>{task.status}</Badge>
                  {isAdmin && task.status !== 'Completed' && task.status !== 'Cancelled' && (
                    <Button variant="outline" size="sm" onClick={() => markComplete(task.id)}>
                      Mark complete
                    </Button>
                  )}
                  {task.equipment?.id && (
                    <Link to={`/dashboard/equipment/${task.equipment.id}`}>
                      <Button variant="ghost" size="sm">View item</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
