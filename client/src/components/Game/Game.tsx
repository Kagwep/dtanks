import React, { useRef, useEffect } from 'react';
import { Engine, Scene, SceneLoader, UniversalCamera, Vector3 } from '@babylonjs/core';
import { useGame } from '@/hooks/useGame';
import { useGetPlayersForGame } from '@/hooks/useGetPlayersForGame';
import { useMe } from '@/hooks/useMe';
import useNetworkAccount from '@/hooks/useNetworkAccount';
import { useElementStore } from '@/utils/dtanks';
import GameScene from './Scene';
import { useDojo } from '@/dojo/useDojo';
import { Account, AccountInterface } from 'starknet';
import { useDtanksUnits } from '@/hooks/useGetDTanksUnits';
import { useTiles } from '@/hooks/useGetTiles';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null); // Keep reference to Scene instance


  const { account, address, status, isConnected } = useNetworkAccount();
  const { set_game_state, set_game_id, game_id, round_limit } = useElementStore((state) => state);

  const {
    setup: {
      client: { arena,actions }
    },
  } = useDojo();

  const getAccount = () : AccountInterface | Account => {
    return account
  }

  const game = useGame();

  const { players } = useGetPlayersForGame(game_id);

  const { me } = useMe();

  const { dtankUnits,
    isSyncing,
    lastSyncTime: armoredLastAsyncTime,
    syncNow: syncArmoredNow,
    entitiesCount: etitiesCountArmored} = useDtanksUnits();


  const { tiles,
    isSyncing: tilesSync,
    lastSyncTime: tileLastAsyncTime,
    syncNow: syncTileNow,
    entitiesCount: etitiesCountTile} = useTiles();

  useEffect(() => {
    if (canvasRef.current) {
      
      const engine = new Engine(canvasRef.current, true);

      const scene = new Scene(engine);
      

      

    // Set initial metadata
    if (scene) {
      scene.metadata = {
        ...scene.metadata,
        game,
        players,
        me,
        account,
        dtankUnits,
        tiles
      };
    }
    

    sceneRef.current = scene;
    
    //

    // Create a UniversalCamera with a position vector
    const camera = new UniversalCamera("UniversalCamera", new Vector3(0, 10, -20), sceneRef.current);

    // Get the canvas from the engine
    const canvas = engine.getRenderingCanvas();
    
    // Attach controls (WASD movement)
    camera.attachControl(canvas, true);
    
    // Set camera movement speed
    camera.speed = 1.5; // Adjust speed as needed

    const initializeInstance = async () => {
      try {
        const tankContainer = await SceneLoader.LoadAssetContainerAsync(
          "", 
          "/models/Dtank.glb", 
          sceneRef.current
      );
          if (tankContainer){
            new GameScene(sceneRef.current,engine,arena,actions,getAccount,tankContainer,camera);
          }
          
      } catch (error) {
          console.error("Failed to initialize instance:", error);
      }
  };

  initializeInstance();

    engine.runRenderLoop(() => {
        if (sceneRef.current) {
            sceneRef.current.render();
        }
    });

      const handleResize = () => {
        engine.resize();
    };
    
    window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.dispose();
      };
    }
  }, []);


    // Update metadata when game data changes
    useEffect(() => {
      if (sceneRef.current) {
        sceneRef.current.metadata = {
          ...sceneRef.current.metadata, // Preserve other metadata if any
          game,
          players,
          me,
          account,
          dtankUnits,
          tiles
        };
      }
    }, [game, players, me, account,dtankUnits,tiles]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Game;

