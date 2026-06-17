import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { machinesApi } from "@/api/machines.api";
import { MachinePlanCard } from "@/components/machines/MachinePlanCard";

export function MachinesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["machine-plans"], queryFn: machinesApi.plans });

  const claimFree = useMutation({
    mutationFn: machinesApi.claimFreeMachine,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["my-machines"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  if (isLoading) return <div className="screen-center">Cargando máquinas...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurum-gold">Catálogo industrial</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Máquinas AurumX</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data || []).map((plan) => <MachinePlanCard key={plan.slug} plan={plan} onClaimFree={() => claimFree.mutate()} />)}
      </div>
      {claimFree.error ? <p className="text-sm text-red-300">No se pudo reclamar Pico Inicial.</p> : null}
    </div>
  );
}
