import { AnimationGroup, AssetContainer, Mesh, TransformNode, Vector3 } from "@babylonjs/core";
import { useMe } from "../hooks/useMe";
import { useTurn } from "../hooks/useTurn";
import { usePhase } from "../hooks/usePhase";
import { useGame } from "../hooks/useGame";
import { useGetPlayersForGame } from "../hooks/useGetPlayersForGame";
import { Uint256 } from "starknet";

export interface Player {
  // Key fields
  game_id: number;      // u32
  index: number;        // u32
  
  // Address field (in Starknet this would be a contract address)
  address: string;      // Using string to represent ContractAddress
  
  // Basic info
  name: string;         // felt252 mapped to string
  supply: number;       // u32
  
  // Tank counts with constraints
  real_tank_count: number;    // u8, should always be 6
  dummy_tank_count: number;   // u8, should always be 6
  
  // Game state
  last_action: bigint;        // u64
  rank: number;               // u8
  player_score: number;       // u32
  turns_remaining: number;    // u8
  turn_start_time: bigint;    // u64
  
  // Flags and counters
  reveal: boolean;
  placements: number;         // u32
}

  export type BurnerStorage = {
    [address: string]: {
      privateKey: string;
      publicKey: string;
      deployTx: string;
      active: boolean;
      masterAccount: string;
      masterAccountProvider: string;
      gameContract: string;
    };
  };

  // Cell size definition
export interface CellSize {
  width: number;
  height: number;
}

// Tree structure
export interface Tree {
  position: GridPosition;
  capacity: number;
  cell_size: CellSize;
}

// Plants patch structure
export interface PlantsPatch {
  position: GridPosition;
  plant_density: number;
  nb_stacks: number;
}

// Main Tile interface
export interface Tile {
  // Key fields
  game_id: number;
  row: number;
  col: number;
  
  // Complex fields
  plants: PlantsPatch;
  tree: Tree;
  
  // Basic fields
  size: number;
  occupied: boolean;
}
  export type Point = {
    x: number;
    y: number;
  };
  
  export type Continent = {
    id: number;
    name: string;
    regions: number[];
    supply: number;
  };
  
  export interface Duel {
    battleId: number;
    duelId: number;
    attackerValue: number;
    defenderValue: number;
  }
  
  export interface Battle {
    gameId: number;
    attackerIndex: number;
    defenderIndex: number;
    attackerTroops: number;
    defenderTroops: number;
    rounds: Duel[][];
  }
  

  export enum UnitType {
    Infantry,
    Armored,
    Air,
    Naval,
    Cyber,
}

export enum  BannerLevel {
  Recruit,
  Soldier,
  Veteran,
  Elite,
  Commander,
  Legend,
  Mythic
}


export enum BattlefieldName {
  None,
  RadiantShores,
  Ironforge,
  Skullcrag,
  NovaWarhound,
  SavageCoast,
}

export interface EncodedVector3 {
  x: Uint256;
  y: Uint256;
  z: Uint256;
}



export interface GameState {
  player: ReturnType<typeof useMe>['me'];
  isItMyTurn: ReturnType<typeof useMe>['isItMyTurn'];
  turn: ReturnType<typeof useTurn>['turn'];
  phase: ReturnType<typeof usePhase>['phase'];
  game: ReturnType<typeof useGame>;
  players: ReturnType<typeof useGetPlayersForGame>['players'];
}


export interface Region {
  name: BattlefieldName;
  points: Vector3[];
}

export interface Deploy {
  game_id: number;            // number
  battlefield_id: number;     // u8
  unit: number;               // u8
  supply: number;             // number
  x: Uint256;                  // u256
  y: Uint256;                  // u256
  z: Uint256;                  // u256
  terrain_num: number;        // u8
  cover_level: number;        // u8
  elevation: number;          // u8
}


export enum AbilityType {
    Attack,
    Defend,
    Patrol,
    Stealth,
    Recon,
    Hack,
    Repair,
    Airlift,
    Bombard,
    Submerge,
}

export interface UnitAbilities {
  [key: string]: number;
}


export enum ToastType {
  Success = "success",
  Error = "error",
  Warning = "warning",
  Info = "info"
}

export interface DeploymentParams {
  unitId: number;
  isDummy: boolean;
  codeName: string;
  timestamp: number;
  gameId?: number;  // Optional if needed
}




// UnitMode enum (matching your contract)
export enum UnitMode {
  Idle,
  Moving,
  Attacking,
  Defending,
  Patrolling,
  Stealthed,
  Reconning,
  Healing,
  Retreating,
  Repairing,
}


export interface DeployInfo {
   unit: UnitType; position: Vector3 | null
}

export type UnitAssetContainers = {
  [key in UnitType]: AssetContainer;
};

export interface AgentAnimations {
  idle: AnimationGroup;
  movement: AnimationGroup;
  attack?: AnimationGroup;
  [key: string]: AnimationGroup | undefined;
}

export interface Agent {
  navAgent: TransformNode;
  visualMesh: Mesh;
  idx: number;
  animations: AgentAnimations;
  animationGroups: AnimationGroup[];
  cUnitType:UnitType;
}

export interface AnimationMapping {
  idle: string[];
  movement: string[];
  attack?: string[];
  [key: string]: string[] | undefined;
}


export type UnitAnimations = {
  [key in UnitType] : AnimationMapping
}

export const SCALING_FACTOR = 1_000_000_000_000_000_000n; // 1e18 as a BigInt


export interface InfantryAccessories {
  ammunition: number;
  first_aid_kit: number;
  molotov: number;
  grenade: number;
}

export interface InfantryHealth {
  current: number;
  max: number;
}

export interface Vec3 {
  x: bigint;
  y: bigint;
  z: bigint;
}

export interface Position {
  coord: Vec3;
}

export interface Infantry {
  game_id: number;
  unit_id: number;
  player_id: number;
  range: bigint;
  firepower: number;
  accuracy: number;
  accessories: InfantryAccessories;
  health: InfantryHealth;
  position: Position;
  battlefield_name: BattlefieldName;
}

export interface ArmoredAccessories {
  fuel: number;
  main_gun_ammunition: number;
  secondary_gun_ammunition: number;
  smoke_grenades: number;
  repair_kits: number;
  active_protection_system: number;
}

export interface ArmoredHealth {
  hull_integrity: number;
  turret_integrity: number;
  track_integrity: number;
}

export interface Armored {
  game_id: number;
  unit_id: number;
  player_id: number;
  accuracy: number;
  firepower: number;
  range: bigint;
  accessories: ArmoredAccessories;
  armored_health: ArmoredHealth;
  position: Position;
  battlefield_name: number;
}


// Position type matching GridPosition
export interface GridPosition {
  row: number;
  col: number;
}

// Main Dtank type
export interface Dtank {
  // Key fields
  game_id: number;
  unit_id: number;
  player_id: number;
  
  // Data fields
  ammunition: number;
  health: number;
  position: GridPosition;
  is_active: boolean;
  target_id: number;
  commitment: string;  // felt252 is represented as string in TypeScript
  pending_damage: number;
}

