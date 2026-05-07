'use client';

import { useEffect, useState } from 'react';
import type { ComplianceLiveData } from '../lib/compliance-data';

export type DataSource = 'mock' | 'supabase';

export function useComplianceData() {
  const [data, setData]       = useState<ComplianceLiveData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    import('../lib/compliance-data')
      .then(({ getComplianceLiveData }) => getComplianceLiveData())
      .then(result => {
        if (!mounted) return;
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const source: DataSource = data ? 'supabase' : 'mock';

  return {
    data,
    source,
    loading,
    isLive: source === 'supabase',
  };
}
