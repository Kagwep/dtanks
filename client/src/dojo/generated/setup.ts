

import { getSyncEntities } from '@dojoengine/state';
import { DojoConfig, DojoProvider } from '@dojoengine/core';
import * as torii from '@dojoengine/torii-client';
import { createClientComponents } from '../createClientComponents';
import { defineContractComponents } from './contractComponents';
import { world } from './world';
import { setupWorld } from '../systems';
import { Account, RpcProvider } from 'starknet';
import { BurnerManager } from '@dojoengine/create-burner';
import { TypedData, WeierstrassSignatureType } from 'starknet';
import { Network } from '../../utils/dtanks';

export type SetupResult = Awaited<ReturnType<typeof setup>>;

interface SetupProps {
  network: Network;
  setCreateBurner: (createBurner: boolean) => void;
}

export async function setup({ network, setCreateBurner, ...config }: SetupProps & DojoConfig) {

  console.log(config)
    
  // torii client
  const toriiClient = await torii.createClient({
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    relayUrl: '',
    worldAddress: config.manifest.world.address || '',
  });

  console.log(toriiClient)

  // create contract components
  const contractComponents = defineContractComponents(world);

  // create client components
  const clientComponents = createClientComponents({ contractComponents });

  // fetch all existing entities from torii
  const sync = await getSyncEntities(
    toriiClient,
    contractComponents as any,
    undefined
);

  // create dojo provider
  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl);

  // setup world
  const client = await setupWorld(dojoProvider);

  console.log(client)


  const newProvider = new RpcProvider({
    nodeUrl: config.rpcUrl,
  });

  // create burner manager
  const burnerManager = new BurnerManager({
    masterAccount: new Account(newProvider, config.masterAddress, config.masterPrivateKey),
    accountClassHash: config.accountClassHash,
    rpcProvider: newProvider,
    feeTokenAddress: "0x0",
  });

  await burnerManager.init();

  if (
    burnerManager.list().length === 0 &&
    (network === "localKatana" || network === "katana")
  ) {
    try {
      setCreateBurner(true);
      await burnerManager.create();
      setCreateBurner(false);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    client,
    clientComponents,
    contractComponents,
    publish: (typedData: string, signature: WeierstrassSignatureType) => {
      toriiClient.publishMessage(typedData, {
        r: signature.r.toString(),
        s: signature.s.toString(),
      });
    },
    config,
    dojoProvider,
    burnerManager,
    world,
    toriiClient
  };
}


