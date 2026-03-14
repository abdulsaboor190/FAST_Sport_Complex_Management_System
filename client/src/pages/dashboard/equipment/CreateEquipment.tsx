import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useCreateEquipmentMutation, useGetCategoriesQuery } from '@/store/api/equipmentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';

const schema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  name: z.string().min(1, 'Name is required'),
  sportType: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']).optional(),
  quantity: z.number().int().min(1).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  purchaseDate: z.string().optional(),
  warrantyUntil: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function CreateEquipment() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const { data: categories } = useGetCategoriesQuery();
  const [create, { isLoading }] = useCreateEquipmentMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: '',
      name: '',
      condition: 'Good',
      quantity: 1,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const body: Record<string, unknown> = {
        categoryId: data.categoryId,
        name: data.name,
        sportType: data.sportType || undefined,
        brand: data.brand || undefined,
        condition: data.condition,
        quantity: data.quantity != null && !Number.isNaN(data.quantity) ? data.quantity : 1,
        lowStockThreshold: data.lowStockThreshold != null && !Number.isNaN(data.lowStockThreshold) ? data.lowStockThreshold : undefined,
      };
      if (data.purchaseDate) body.purchaseDate = new Date(data.purchaseDate).toISOString();
      if (data.warrantyUntil) body.warrantyUntil = new Date(data.warrantyUntil).toISOString();
      await create(body).unwrap();
      toast.success('Equipment created');
      form.reset();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed to create');
    }
  });

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Link to="/dashboard/equipment">
          <Button variant="outline">Back to equipment</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/equipment/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add equipment</h1>
      </div>

      <Card className="border-border/50 bg-card shadow-sm max-w-xl">
        <CardHeader>
          <CardTitle>New equipment item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                {...form.register('categoryId')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                {...form.register('name')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Football"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sport type</label>
                <input
                  {...form.register('sportType')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Football"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  {...form.register('brand')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select
                  {...form.register('condition')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  {...form.register('quantity', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Low stock alert (threshold)</label>
              <input
                type="number"
                min={0}
                {...form.register('lowStockThreshold', { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Alert when quantity falls below"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Purchase date</label>
                <input
                  type="date"
                  {...form.register('purchaseDate')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warranty until</label>
                <input
                  type="date"
                  {...form.register('warrantyUntil')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>Create</Button>
              <Link to="/dashboard/equipment/admin">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
