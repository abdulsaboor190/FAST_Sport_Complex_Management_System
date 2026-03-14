import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useCreateEventMutation } from '@/store/api/eventsApi';
import type { EventType, EventStatus } from '@/store/api/eventsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';

const schema = z.object({
  type: z.enum(['Workshop', 'Seminar', 'SportsDay', 'FitnessChallenge']),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  venue: z.string().optional(),
  registrationRequired: z.boolean().optional(),
  capacity: z.number().int().min(0).optional(),
  entryFee: z.number().min(0).optional(),
  status: z.enum(['Draft', 'Published']).optional(),
});
type FormData = z.infer<typeof schema>;

export function CreateEvent() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const [create, { isLoading }] = useCreateEventMutation();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Workshop',
      registrationRequired: true,
      entryFee: 0,
      status: 'Draft',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await create({
        type: data.type as EventType,
        title: data.title,
        description: data.description || undefined,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        venue: data.venue || undefined,
        registrationRequired: data.registrationRequired ?? true,
        capacity: data.capacity ?? null,
        entryFee: data.entryFee ?? 0,
        status: (data.status as EventStatus) ?? 'Draft',
      }).unwrap();
      toast.success('Event created');
      form.reset();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed to create');
    }
  });

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Link to="/dashboard/events"><Button variant="outline">Back to events</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create event</h1>
      </div>

      <Card className="border-border/50 bg-card shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle>New event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select {...form.register('type')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="SportsDay">Sports Day</option>
                <option value="FitnessChallenge">Fitness Challenge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input {...form.register('title')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea {...form.register('description')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start *</label>
                <input type="datetime-local" {...form.register('startTime')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End *</label>
                <input type="datetime-local" {...form.register('endTime')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input {...form.register('venue')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...form.register('registrationRequired')} className="rounded" />
                <span className="text-sm">Registration required</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (0 = unlimited)</label>
                <input type="number" min={0} {...form.register('capacity', { valueAsNumber: true })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entry fee (Rs)</label>
                <input type="number" min={0} {...form.register('entryFee', { valueAsNumber: true })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select {...form.register('status')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>Create event</Button>
              <Link to="/dashboard/events"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
