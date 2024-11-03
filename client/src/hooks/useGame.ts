import { useDojo } from '../dojo/useDojo';
import { sanitizeGame } from '../utils/sanitizer';
import { useElementStore } from '../utils/dtanks';
import { Has, HasValue, getComponentValue } from '@dojoengine/recs';
import { useEntityQuery } from '@dojoengine/react';
import { useEffect, useMemo, useState } from 'react';
import { getSyncEntities } from '@dojoengine/state';

export const useGame = () => {
  const {
    setup: {
      clientComponents: { Game },
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

    // useEffect(() => {
    //   if (game_id === undefined || game_id === null) return;

    //   console.log('Starting sync for game:', game_id);
      
    //   syncEntities();
    //   const interval = setInterval(syncEntities, 1000);
      
    //   return () => clearInterval(interval);
    // }, []); // Empty since game_id is static
    // Following the same pattern as useGetPlayersForGame
    const gameEntities = useEntityQuery([
      Has(Game), 
      HasValue(Game, { game_id: game_id })
    ]);

  // Use useMemo for efficient processing
  const gameData = useMemo(() => {
    const gameComponent = gameEntities
      .map(entity => getComponentValue(Game, entity))
      .find(game => game); // Get first valid game

    if (!gameComponent) return undefined;


    const sanitizedGame = sanitizeGame(gameComponent);
    
    const current_turn = Math.floor(sanitizedGame.nonce / (3 * sanitizedGame.player_count) + 1);
    const number_max_turns = Math.floor(sanitizedGame.limit / (3 * sanitizedGame.player_count));

    return {
      ...sanitizedGame,
      current_turn: Math.min(current_turn, number_max_turns),
      number_max_turns: number_max_turns,
    };
  }, [gameEntities, Game]);

  return gameData;
};