import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateIssueMutation } from '@/store/api/issueApi';
import { useGetFacilitiesQuery } from '@/store/api/facilitiesApi';
import { useGetEquipmentQuery } from '@/store/api/equipmentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const schema = z.object({
  category: z.enum(['Facility', 'Equipment', 'Booking', 'Safety', 'Other']),
  facilityId: z.string().optional(),
  equipmentId: z.string().optional(),
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  location: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export function ReportIssue() {
  const navigate = useNavigate();
  const { data: facilities, isLoading: facilitiesLoading } = useGetFacilitiesQuery();
  const { data: equipment, isLoading: equipmentLoading } = useGetEquipmentQuery({});
  const [files, setFiles] = useState<FileList | null>(null);
  const [createIssue, { isLoading }] = useCreateIssueMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Facility', priority: 'Medium' },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const fd = new FormData();
      fd.append('category', data.category);
      if (data.facilityId) fd.append('facilityId', data.facilityId);
      if (data.equipmentId) fd.append('equipmentId', data.equipmentId);
      fd.append('title', data.title);
      if (data.description) fd.append('description', data.description);
      fd.append('priority', data.priority);
      if (data.location) fd.append('location', data.location);
      if (files) {
        Array.from(files).forEach((file) => fd.append('files', file));
      }
      await createIssue(fd).unwrap();
      toast.success('Issue reported');
      navigate('/dashboard/issues');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed to submit issue');
    }
  });

  const watchingCategory = form.watch('category');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/issues">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report an issue</h1>
          <p className="text-muted-foreground">Help us keep facilities and equipment in top condition.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Issue details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  {...form.register('category')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Facility">Facility</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Booking">Booking</option>
                  <option value="Safety">Safety</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority *</label>
                <select
                  {...form.register('priority')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            {watchingCategory === 'Facility' && (
              <div>
                <label className="block text-sm font-medium mb-1">Facility</label>
                {facilitiesLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <select
                    {...form.register('facilityId')}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select facility</option>
                    {facilities?.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {watchingCategory === 'Equipment' && (
              <div>
                <label className="block text-sm font-medium mb-1">Equipment</label>
                {equipmentLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <select
                    {...form.register('equipmentId')}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select equipment</option>
                    {equipment?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Issue title *</label>
              <input
                {...form.register('title')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Short description"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                {...form.register('description')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Provide more details about the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location details</label>
              <input
                {...form.register('location')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Badminton Court 1 – near entrance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Photos / Videos</label>
              <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40 text-sm text-muted-foreground">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={(e) => setFiles(e.target.files)}
                />
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Drag & drop or click to upload
                </span>
              </label>
              {files && files.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{files.length} file(s) selected</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Submit issue
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/issues')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

