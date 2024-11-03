import { validateAndParseAddress} from 'starknet';
import { feltToStr, unpackU128toNumberArray } from './unpack';
import { Player, } from './types';
import { Dtank, Tile } from '@/types';

export const sanitizeGame = (game: any) => {


  return {
    ...game,
    arena: bigIntAddressToString(game.dtanks_host),
    player_count: game.player_count,
  };
};

export const sanitizePlayer = (player: any): Player => {
  return {
    ...player,
    address: bigIntAddressToString(player.address),
    name: feltToStr(player.name),
  };
};

export const sanitizeDtank = (dtank: any): Dtank=> {
  return dtank as Dtank; //add more santizing
};

export const sanitizeTile = (tile: any): Tile=> {
  return tile as Tile; //add more santizing
};



export const bigIntAddressToString = (address: bigint) => {
  // Convert bigint to hex string and ensure it's the correct length
  let hexString = '0x' + address.toString(16).padStart(64, '0');
  return removeLeadingZeros(validateAndParseAddress(hexString));
};

export const shortAddress = (address: string, size = 4) => {
  return `${address.slice(0, size)}...${address.slice(-size)}`;
};

export const removeLeadingZeros = (address: string) => {
  // Check if the address starts with '0x' and then remove leading zeros from the hexadecimal part
  if (address.startsWith('0x')) {
    return '0x' + address.substring(2).replace(/^0+/, '');
  }
  // Return the original address if it doesn't start with '0x'
  return address;
};
