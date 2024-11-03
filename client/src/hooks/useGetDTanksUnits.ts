import { useDojo } from '../dojo/useDojo';
import { sanitizeDtank } from '../utils/sanitizer';
import { useElementStore } from '../utils/dtanks';
import { useComponentValue, useEntityQuery } from '@dojoengine/react';
import { Has, HasValue, getComponentValue } from '@dojoengine/recs';
import { useMemo, useEffect, useState } from 'react';
import { getSyncEntities } from '@dojoengine/state';

export const useDtanksUnits = () => {
  const {
    setup: {
      clientComponents: { Dtank, Game },
      contractComponents,
      toriiClient,
    },
  } = useDojo();

  const { game_id } = useElementStore((state) => state);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncEntities = async () => {
    if (game_id === undefined || game_id === null || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await getSyncEntities(
        toriiClient,
        contractComponents as any,
        undefined
      );
      
      setLastSyncTime(new Date());
      console.log('Synced entities with chain');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (game_id === undefined || game_id === null) return;

   // console.log('Starting sync for game:', game_id);
    
    syncEntities();
    const interval = setInterval(syncEntities, 1000);
    
    return () => clearInterval(interval);
  }, []); // Empty since game_id is static

  const dtankEntities = useEntityQuery(
    [Has(Dtank), HasValue(Dtank, { game_id })],
    {
      updateOnValueChange: true
    }
  );

  const dtankUnits = useMemo(() => {
    //console.log('Processing dtank units after sync:', lastSyncTime);
    
    return dtankEntities
      .map((id) => getComponentValue(Dtank, id))
      .filter(Boolean)
      .sort((a, b) => a.unit_id - b.unit_id)
      .map(sanitizeDtank)
      .filter((dtank) => dtank.health !== 0);
  }, [dtankEntities, Dtank, lastSyncTime]);

  return {
    dtankUnits,
    isSyncing,
    lastSyncTime,
    syncNow: syncEntities,
    entitiesCount: dtankEntities.length
  };
};