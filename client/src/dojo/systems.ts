/* previously called generated.ts */

import { DojoProvider } from '@dojoengine/core';
import { AccountInterface, GetTransactionReceiptResponse, UniversalDetails, cairo, num } from 'starknet';


const tryBetterErrorMsg = (msg: string): string => {
  const failureReasonIndex = msg.indexOf('Failure reason');
  if (failureReasonIndex > 0) {
    let betterMsg = msg.substring(failureReasonIndex);
    const cairoTracebackIndex = betterMsg.indexOf('Cairo traceback');
    betterMsg = betterMsg.substring(0, cairoTracebackIndex);

    const regex = /Failure reason:.*?\('([^']+)'\)/;
    const matches = betterMsg.match(regex);

    if (matches && matches.length > 1) {
      return matches[1];
    } else {
      return betterMsg;
    }
  }

  return msg;
};

export async function setupWorld(provider: DojoProvider) {
  // Transaction execution and checking wrapper
  const executeAndCheck = async (account: AccountInterface, contractName: string, methodName: string, args: any[]) => {

    console.log("called ........", account);
    console.log("called ........", {contractName, entrypoint: methodName, calldata: args});
    
    const details: UniversalDetails = {
      skipValidate: true,
      maxFee: "0xFFFFFFFFFFFFFFFF",
      resourceBounds: {
        l1_gas: {
          max_amount: "0x7fffffffffffffff",      // u64 max amount
          max_price_per_unit: "0x1"             // u128 max price
        },
        l2_gas: {
          max_amount: "0x7fffffffffffffff",      // u64 max amount
          max_price_per_unit: "0x1"             // u128 max price
        }
      },
    };


    const ret = await provider.execute(
      account, 
      {
        contractName,
        entrypoint: methodName,
        calldata: args
      },
      details
    );

    console.log(ret.transaction_hash);

    const receipt = await account.waitForTransaction(ret.transaction_hash, {
      retryInterval: 100,
    });

   

    // Add any additional checks or logic here based on the receipt
    if (receipt.revert_reason === 'REJECTED') {
      console.log('Transaction Rejected');
      throw new Error('[Tx REJECTED] ');
    }

    if ('execution_status' in receipt) {
      // The receipt is of a type that includes execution_status
      if (receipt.execution_status === 'REVERTED') {
        const errorMessage = tryBetterErrorMsg(
          (receipt as GetTransactionReceiptResponse).revert_reason || 'Transaction Reverted'
        );
        console.log('ERROR KATANA', errorMessage);
        throw new Error('[Tx REVERTED] ' + errorMessage);
      }
    }

    return receipt;
  };

  function arena() {
    const contractName = 'arena';
    const create = async (account: AccountInterface, playerName: string, price: bigint, penalty: number) => {
      
      try {
        return await executeAndCheck(account, contractName, 'create', [
          playerName,
          cairo.uint256(price),
          penalty,
        ]);
      } catch (error) {
        console.error('Error executing create:', error.message);
        throw error;
      }
    };

    const join = async (account: AccountInterface, gameId: number, playerName: string) => {
      try {
        return await executeAndCheck(account, contractName, 'join', [ gameId, playerName]);
      } catch (error) {
        console.error('Error executing join:', error);
        throw error;
      }
    };

    const leave = async (account: AccountInterface, gameId: number) => {
      try {
        return await executeAndCheck(account, contractName, 'leave', [provider.getWorldAddress(), gameId]);
      } catch (error) {
        console.error('Error executing leave:', error);
        throw error;
      }
    };

    const start = async (account: AccountInterface, gameId: number, roundLimit: number) => {
      try {
        return await executeAndCheck(account, contractName, 'start', [gameId, roundLimit]);
      } catch (error) {
        console.error('Error executing start:', error);
        throw error;
      }
    };

    const kick = async (account: AccountInterface, gameId: number, playerIndex: number) => {
      try {
        return await executeAndCheck(account, contractName, 'kick', [gameId, playerIndex]);
      } catch (error) {
        console.error('Error executing kick:', error);
        throw error;
      }
    };

    const transfer = async (account: AccountInterface, gameId: number, playerIndex: number) => {
      try {
        return await executeAndCheck(account, contractName, 'transfer', [
          provider.getWorldAddress(),
          gameId,
          playerIndex,
        ]);
      } catch (error) {
        console.error('Error executing kick:', error);
        throw error;
      }
    };

    const delete_game = async (account: AccountInterface, gameId: number) => {
      try {
        return await executeAndCheck(account, contractName, 'delete', [provider.getWorldAddress(), gameId]);
      } catch (error) {
        console.error('Error executing delete:', error);
        throw error;
      }
    };

    const claim = async (account: AccountInterface, gameId: number) => {
      try {
        return await executeAndCheck(account, contractName, 'claim', [provider.getWorldAddress(), gameId]);
      } catch (error) {
        console.error('Error executing claim:', error);
        throw error;
      }
    };

    return {
      create,
      start,
      join,
      leave,
      kick,
      delete_game,
      transfer,
    };
  }

  function actions() {
    const contractName = 'actions';
    const deploy = async (account: AccountInterface,gameId: number,row:number,col:number,is_dummy:boolean, salt: string) => {
      
      try {
        return await executeAndCheck(account, contractName, 'deploy', [
          gameId,
          row,
          col,
          is_dummy,
          salt
        ]);
      } catch (error) {
        console.error('Error executing deploy forces:', error.message);
        return error;
      }
    };


    const move = async (account: AccountInterface,gameId: number, unitId: number, row: number, col: number) => {
      try {
        return await executeAndCheck(account, contractName, 'move', [gameId,  unitId, row,col]);
      } catch (error) {
        console.error('Error executing move_unit:', error);
        throw error;
      }
    };

    const aim = async (account: AccountInterface,gameId: number, unitId: number, targetId: number) => {
      try {
        return await executeAndCheck(account, contractName, 'aim', [gameId, unitId, targetId]);
      } catch (error) {
        console.error('Error executing stealth:', error);
        throw error;
      }
    };

    const fire = async (account: AccountInterface, gameId: number, unitId: number, is_dummy:boolean, salt: string) => {
      try {
        return await executeAndCheck(account, contractName, 'fire', [ gameId, unitId, is_dummy, salt]);
      } catch (error) {
        console.error('Error executing recon:', error);
        throw error;
      }
    };

    const reveal = async (account: AccountInterface, gameId: number, unitId: number, unitType: number,is_dummy:boolean, salt: string) => {
      try {
        return await executeAndCheck(account, contractName, 'reveal', [ gameId, unitId, unitType,is_dummy, salt]);
      } catch (error) {
        console.error('Error executing heal:', error);
        throw error;
      }
    };

    const shrub = async (account: AccountInterface, gameId: number, row: number, col: number) => {
      try {
        return await executeAndCheck(account, contractName, 'shrub', [ gameId, row, col]);
      } catch (error) {
        console.error('Error executing recon:', error);
        throw error;
      }
    };

    const tree = async (account: AccountInterface, gameId: number, row: number, col: number) => {
      try {
        return await executeAndCheck(account, contractName, 'tree', [ gameId, row,col]);
      } catch (error) {
        console.error('Error executing heal:', error);
        throw error;
      }
    };

    return {
      deploy,
      move,
      aim,
      fire,
      reveal,
      shrub,
      tree 
    };
  }

  return {
    arena: arena(),
    actions: actions()
  };
}
