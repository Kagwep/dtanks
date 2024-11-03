import React,{ useState,useCallback,useEffect } from "react";
import { useElementStore } from './utils/dtanks';
import MainMenu from "./components/MainMenu";
import GameState from './utils/gamestate';
import Lobby from './components/Lobby';
import useNetworkAccount from "./hooks/useNetworkAccount";
import Dtanks from "./components/Game/Game";

export interface ServerJoinRoomResponse {

}


export interface InitGameProps {

    
}

const InitGame = () => {

  const { account, address, status, isConnected } = useNetworkAccount();
  
  const { game_state, battleReport, setBattleReport } = useElementStore((state) => state);

  return (

    <>

    {account ? (

    <div className="bg-black pb-4">
    {game_state === GameState.MainMenu && <MainMenu />}
    {game_state === GameState.Lobby && <Lobby />}
    {game_state === GameState.Game && <Dtanks />}

    </div>
    ):(

      <p> waiting for account </p>
    )}
    
    
    
    </>

  );
}

export default InitGame;