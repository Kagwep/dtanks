import { useEffect, useState } from 'react';
import { useGetPlayers } from './useGetPlayers';
import { useDojo } from '../dojo/useDojo';
import { useTurn } from './useTurn';
import { Player } from '../utils/types';
import useNetworkAccount from './useNetworkAccount';

export function useMe(): { me: Player | null; isItMyTurn: boolean } {
  
  const { account, address, status, isConnected } = useNetworkAccount();

  const { turn } = useTurn();

  const [me, setMe] = useState<Player | null>(null);


  const { players } = useGetPlayers();

  //console.log(players)


  useEffect(() => {

    if (players.length > 0 && account.address) {
      
      const me = players.find((p) => p.address === account.address);
      if (!me) return;
      
      setMe(me);
    }
  }, [account, players.length]);

  return {
    me,
    isItMyTurn: me?.index === turn,
  };
}
