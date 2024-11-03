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