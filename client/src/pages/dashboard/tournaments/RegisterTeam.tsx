import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterTeamMutation } from '@/store/api/teamApi';
import { useGetTournamentQuery } from '@/store/api/tournamentApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-hot-toast';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

const playerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    fastId: z.string().optional(),
    position: z.string().optional(),
    jerseyNo: z.string().transform(val => val ? parseInt(val, 10) : undefined).optional(),
});

const formSchema = z.object({
    name: z.string().min(2, "Team Name is required"),
    department: z.string().optional(),
    logoUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
    players: z.array(playerSchema).min(1, "At least one player is required"),
});

type FormData = z.infer<typeof formSchema>;

export function RegisterTeam() {
    const { id: tournamentId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: tournament } = useGetTournamentQuery(tournamentId!);
    const [registerTeam, { isLoading }] = useRegisterTeamMutation();

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            players: [{ name: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "players"
    });

    const onSubmit = async (data: FormData) => {
        if (!tournamentId) return;
        try {
            await registerTeam({
                tournamentId,
                ...data,
                logoUrl: data.logoUrl || undefined,
                players: data.players.map(p => ({
                    ...p,
                    jerseyNo: p.jerseyNo as number | undefined
                }))
            }).unwrap();
            toast.success('Team registered successfully!');
            navigate(`/dashboard/tournaments/${tournamentId}`);
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to register team');
        }
    };

    if (!tournament) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/tournaments/${tournamentId}`)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Register Team</h2>
                    <p className="text-muted-foreground">For {tournament.name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Details</CardTitle>
                        <CardDescription>Basic information about your team.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input id="name" {...register('name')} placeholder="e.g. CS Strikers" />
                                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department (Optional)</Label>
                                <Input id="department" {...register('department')} placeholder="e.g. Computer Science" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                            <Input id="logoUrl" {...register('logoUrl')} placeholder="https://..." />
                            {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Player Roster</CardTitle>
                                <CardDescription>Add players to your team roster.</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '' })}>
                                <Plus className="h-4 w-4 mr-2" /> Add Player
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md bg-muted/20">
                                <div className="flex-1 space-y-2">
                                    <Label className={index === 0 ? "" : "sr-only"}>Name</Label>
                                    <Input {...register(`players.${index}.name`)} placeholder="Player Name" />
                                    {errors.players?.[index]?.name && <p className="text-sm text-destructive">{errors.players[index]?.name?.message}</p>}
                                </div>
                                <div className="w-32 space-y-2">
                                    <Label className={index === 0 ? "" : "sr-only"}>FAST ID</Label>
                                    <Input {...register(`players.${index}.fastId`)} placeholder="23K-1234" />
                                </div>
                                <div className="w-32 space-y-2">
                                    <Label className={index === 0 ? "" : "sr-only"}>Position</Label>
                                    <Input {...register(`players.${index}.position`)} placeholder="FW" />
                                </div>
                                <div className="w-20 space-y-2">
                                    <Label className={index === 0 ? "" : "sr-only"}>Jersey</Label>
                                    <Input type="number" {...register(`players.${index}.jerseyNo`)} placeholder="10" />
                                </div>
                                <div className={index === 0 ? "pt-8" : "pt-0"}>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {errors.players?.root && <p className="text-sm text-destructive">{errors.players.root.message}</p>}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading ? 'Registering...' : 'Submit Registration'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
