import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications.api";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/utils/formatDate";

export function NotificationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list });
  if (isLoading) return <div className="screen-center">Cargando notificaciones...</div>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black md:text-5xl">Notificaciones</h1>
      <div className="space-y-3">
        {(data || []).map((item) => (
          <Card key={item.id}>
            <div className="flex justify-between gap-4">
              <div><h2 className="font-black">{item.title}</h2><p className="mt-1 text-zinc-400">{item.message}</p></div>
              <span className="text-xs text-zinc-500">{formatDateTime(item.createdAt)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
