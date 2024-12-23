import { useElementStore } from '../utils/dtanks';
import GameState from '../utils/gamestate';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDojo } from '../dojo/useDojo';
import { useToast } from './UI/use-toast';
import { useComponentValue, useEntityQuery } from '@dojoengine/react';
import { HasValue, getComponentValue } from '@dojoengine/recs';
import { Table, TableBody, TableHead, TableHeader, TableRow } from './UI/table';
import GameRow from './GameRow';
import { DialogCreateJoin } from './DialogCreateJoin';
import WalletButton from './components/WalletButton';
import { useNetworkAccount } from '../contexts/WalletContex';

import { CombineAction } from '@babylonjs/core';
import { useGame } from '@/hooks/useGame';

const MainMenu: React.FC = () => {
  const { toast } = useToast();
  const { set_game_state, set_game_id, player_name, setPlayerName, round_limit, setRoundLimit } = useElementStore(
    (state) => state
  );

  const {
    setup: {
      client: { arena },
      clientComponents: { Game, Player },
    },
  } = useDojo();

  const { account, address, status, isConnected } = useNetworkAccount();

  const prevGameIdRef = useRef<number | null>(null);
  const prevGameStateRef = useRef<GameState | null>(null);

  
  const game = useGame();


  console.log(account,game,address)

  const playerEntities = useEntityQuery([HasValue(Player, { address: BigInt(account.address) })]);
  const playerEntity = useMemo(() => playerEntities.length > 0 ? playerEntities[0] : undefined, [playerEntities]);
  const player = useComponentValue(Player, playerEntity);

  const prevGameRef = useRef(game);
  const prevPlayerRef = useRef(player);

  const updateGameState = useCallback((currentPlayer, currentGame) => {
    console.log("Inside updateGameState callback with params:", currentPlayer);
  
    // If either player or game exists, set the game state to Lobby
    const newGameState = (currentPlayer || currentGame) ? GameState.Lobby : null;

    console.log(currentPlayer?.game_id)
  
    if (currentPlayer?.game_id >= 0) {
      console.log("setting game state");
      set_game_id(currentPlayer.game_id);
    }
  
    if (newGameState !== null) {
      set_game_state(newGameState);
    }
    console.log("executed")
  }, [set_game_id, set_game_state]);
  


  const [hours, setHours] = useState<number | null>(null);
  const [minutes, setMinutes] = useState(5);
  useEffect(() => {
    if (game) {
     // setIsLoading(false);
      console.log('Game updated:', game);

      set_game_id(game.game_id);

    }
  }, [game]);
// In useEffect, pass the current player and game explicitly
useEffect(() => {
  const gameChanged = game !== prevGameRef.current;
  const playerChanged = player !== prevPlayerRef.current;

  if (gameChanged || playerChanged) {
    console.log('Changes detected:', { gameChanged, playerChanged }, player,game);
    
    // Pass the player and game to updateGameState explicitly
    updateGameState(player, game);

    prevGameRef.current = game;
    prevPlayerRef.current = player;
  }
}, [game, player, updateGameState]);

  const createNewGame = async () => {
    if (!player_name) {
      toast({
        variant: 'destructive',
        description: <code className="text-white text-xs">{'Please enter a pseudo'}</code>,
      });
      return;
    }

    try {
      const totalSeconds = hours ? hours * 3600 + minutes * 60 : minutes * 60;
      let result = await arena.create(account, player_name, /* price */ BigInt(0), /* penalty*/ totalSeconds);
      // toast({
      //   variant: 'default',
      //   description: <code className="text-white text-xs">{result.execution_status}</code>,
      // });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: <code className="text-white text-xs">{error.message}</code>,
      });
    }
  };

  const gameEntities: any = useEntityQuery([HasValue(Game, { seed: BigInt(0) })]);
  const games = useMemo(
    () =>
      gameEntities
        .map((id: any) => getComponentValue(Game, id))
        .sort((a: any, b: any) => b.id - a.id)
        .filter((game: any) => game.arena !== 0n),
    [gameEntities, Game]
  );

  console.log(games);

  if (!games) return null;
  return (
    <div className="font-vt323 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center gap-8">
          <header className="w-full flex justify-between items-center mb-6">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-green">
              Dtanks
            </h1>
            <div className="flex items-center gap-4">
              <WalletButton />
            </div>
          </header>

          {games.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-2xl">
              <h2 className="text-3xl mb-6">No active games. Start your adventure!</h2>
              <DialogCreateJoin
                onClick={createNewGame}
                playerName={player_name}
                setPlayerName={setPlayerName}
                dialogTitle="Create a new game"
                buttonText="Create"
                buttonTextDisplayed="Create a New Game"
                hours={hours}
                setHours={(value: number | null) => setHours(value)}
                minutes={minutes}
                setMinutes={setMinutes}
                limit={round_limit}
                setLimit={(value: number) => setRoundLimit(value)}
                isCreating={true}
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
              <div className="p-6 bg-cover bg-center" style={{backgroundImage: "url('https://res.cloudinary.com/dydj8hnhz/image/upload/v1730413962/j5hj0ewsdlfcmghtze6p.webp')"}}>
                <h2 className="text-3xl font-bold mb-4">Active Games</h2>
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-700 bg-opacity-60">
                      <TableHead className="py-3 text-left">Host</TableHead>
                      <TableHead className="py-3 text-center">ID</TableHead>
                      <TableHead className="py-3 text-center">Players</TableHead>
                      <TableHead className="py-3"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((game: any) => (
                      <GameRow key={game.id} game={game} setPlayerName={setPlayerName} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="bg-gray-900 p-4 flex justify-end">
                <DialogCreateJoin
                  onClick={createNewGame}
                  playerName={player_name}
                  setPlayerName={setPlayerName}
                  dialogTitle="Create a new game"
                  buttonText="Create"
                  buttonTextDisplayed="Create a New Game"
                  hours={hours}
                  setHours={setHours}
                  minutes={minutes}
                  setMinutes={setMinutes}
                  limit={round_limit}
                  setLimit={(value: number) => setRoundLimit(value)}
                  isCreating={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
};

export default MainMenu;
