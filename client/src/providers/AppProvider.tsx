import ControllerConnector from '@cartridge/connector/controller'
import {  sepolia } from '@starknet-react/chains'
import { StarknetConfig, starkscan } from '@starknet-react/core'
import { RpcProvider } from 'starknet'

import { ACTIONS_ADDRESS, ARENA_ADDRESS, TORII_RPC_URL } from '@/constants'

import type { Chain } from '@starknet-react/chains'
import type { PropsWithChildren } from 'react'
import { defaultPresets } from '@cartridge/controller'

export function StarknetProvider({ children }: PropsWithChildren) {
  return (
    <StarknetConfig
      autoConnect
      chains={[ sepolia]}
      connectors={[cartridge]}
      explorer={starkscan}
      provider={provider}
    >
      {children}
    </StarknetConfig>
  )
}

const cartridge = new ControllerConnector({
  policies: [
    {
      target: ARENA_ADDRESS,
      method: 'create',
      description: 'create new dtank game',
    },
    {
      target: ARENA_ADDRESS,
      method: 'join',
      description: 'Join dtank game',
    },
    {
      target: ARENA_ADDRESS,
      method: 'transfer',
      description: 'transfer game to player two',
    },
    {
      target: ARENA_ADDRESS,
      method: 'leave',
      description: 'leave Dtanks Game',
    },
    {
      target: ARENA_ADDRESS,
      method: 'start',
      description: 'Start dtanks game',
    },
    {
      target: ARENA_ADDRESS,
      method: 'delete',
      description: 'delete Dtanks game',
    },
    {
      target: ARENA_ADDRESS,
      method: 'kick',
      description: 'kick player out',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'deploy',
      description: 'deploy dtanks',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'move',
      description: 'Move dtanks',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'aim',
      description: 'Target Opponents Dtank',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'fire',
      description: 'FIre towards dtank',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'reveal',
      description: 'Is Dtank Dummy',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'tree',
      description: 'add tree to battlefield',
    },
    {
      target: ACTIONS_ADDRESS,
      method: 'shrub',
      description: 'Add shrubs on battle field',
    },
  ],
  url: 'https://x.cartridge.gg',
  rpc: "https://api.cartridge.gg/x/dtankstest/katana",
  theme: 'dtanks',
  config: {
    presets: {
      ...defaultPresets,  // spread the default presets
      dtanks: {          // add your custom preset
        id: 'dtanks',
        name: 'dtanks',
        icon: 'http://localhost:5173/dtanks.png',
        cover: 'http://localhost:5173/cover.png',
        colors: {
          primary: '#4A5D23',
        },
      },
    },
  },
  propagateSessionErrors: true,
})


function provider(chain: Chain) {
  return new RpcProvider({
      nodeUrl: "https://api.cartridge.gg/x/dtankstest/katana",
  });
}