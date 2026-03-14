import { useState, useEffect } from 'react';
import { clientApi, ClientWithHours } from '../services/clientApi';

interface ClientData {
  name: string;
  total: number;
  billable: number;
  budget: number;
  color: string;
  team: string[];
  email?: string;
  phone?: string;
  hourlyRate?: number;
}

export const useClientReport = (dateRange: { start: Date; end: Date }) => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [totalBillable, setTotalBillable] = useState(0);
  const [totalBillableHours, setTotalBillableHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const rawClients = await clientApi.getClients({ includeHours: true }) as ClientWithHours[];

        const mappedClients: ClientData[] = rawClients.map(c => ({
          name: c.name || c.company || 'Unknown',
          total: c.trackedHours || c.total_hours || 0,
          billable: c.trackedHours || 0,
          budget: 100,
          color: c.color || 'bg-neutral-500',
          team: [],
          email: c.email,
          phone: c.phone,
          hourlyRate: c.hourlyRate
        }));

        const currentTotalBillableHours = mappedClients.reduce((sum, c) => sum + c.billable, 0);
        
        setClients(mappedClients);
        setTotalBillableHours(currentTotalBillableHours);
        
        const total = mappedClients.reduce((sum, c) => {
          const rate = c.hourlyRate || 150;
          return sum + (c.billable * rate);
        }, 0);
        setTotalBillable(total);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load client report');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange.start, dateRange.end]);

  return { clients, totalBillable, totalBillableHours, loading, error };
};
