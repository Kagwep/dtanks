use core::zeroable::Zeroable;
use starknet::ContractAddress;



const INITIAL_MOVES: u8 = 12;
const ACTION_MOVES: u8 = 3;
const TURN_TIME_LIMIT_SECONDS: u64 = 2000;
const PLACEMENTS: u32 = 84;

mod errors {
    const PLAYER_INVALID_RANK: felt252 = 'Player: invalid rank';
    const PLAYER_NOT_EXISTS: felt252 = 'Player: does not exist';
    const PLAYER_DOES_EXIST: felt252 = 'Player: does exist';
    const PLAYER_IS_DEAD: felt252 = 'Player: is dead';
    const NO_COMMANDS: felt252 = 'Player:  No Commands';
}

#[derive(Copy,Drop,Serde)]
#[dojo::model]
struct Player {
    #[key]
    game_id: u32,
    #[key]
    index: u32,
    address: starknet::ContractAddress,
    name: felt252,
    supply: u32,
    real_tank_count: u8,    // Should always be 6
    dummy_tank_count: u8,   // Should always be 6
    last_action:u64,
    rank: u8,
    player_score: u32,
    turns_remaining: u8,
    turn_start_time: u64,
    reveal:bool,
    placements:u32,
}



#[generate_trait]
impl PlayerImpl of PlayerTrait {
    #[inline(always)]
    fn new(game_id: u32, index: u32, address: ContractAddress, name: felt252 ) -> Player {
        Player { 
        game_id, index, address, name,
        supply: 12,
        real_tank_count: 6,    // Should always be 6
        dummy_tank_count: 6,   // Should always be 6    
        last_action: 0,
        rank: 0,
        player_score: 0,
        turns_remaining: INITIAL_MOVES,
        turn_start_time: 0,
        reveal:false,
        placements:PLACEMENTS,
    }
    }

    #[inline(always)]
    fn reset_moves(ref self: Player) {
        self.turns_remaining = ACTION_MOVES;
    }

    #[inline(always)]
    fn use_turn(ref self: Player) -> u8 {
        assert(self.turns_remaining >= 0,'No Turns remaining.');
        self.turns_remaining -= 1;

        self.turns_remaining

    }

    fn consume_placements(ref self: Player){
        assert(self.placements >= 0,'No Placements remaining.');
        self.placements -=1;
    }

    #[inline(always)]
    fn is_turn_timed_out(self: Player, current_time: u64) -> bool {
        assert(self.turn_start_time != 0, 'Round not Initialized');
        current_time - self.turn_start_time > TURN_TIME_LIMIT_SECONDS
    }

    #[inline(always)]
    fn is_dead(self: Player) -> bool {
        self.rank > 0
    }

    #[inline(always)]
    fn rank(ref self: Player, rank: u8) {
        assert(self.rank == 0, errors::PLAYER_IS_DEAD);
        assert(rank != 0, errors::PLAYER_INVALID_RANK);
        self.rank = rank;
    }

    #[inline(always)]
    fn nullify(ref self: Player) {
        self.address = Zeroable::zero();
        self.name = 0;
        self.supply = 0;
        self.rank = 0;
        self.player_score = 0;
        self.turns_remaining = 0;
        self.turn_start_time = 0;
    }

    #[inline(always)]
    fn get_dtank_supply(ref self: Player) -> u32{
        self.supply
    }

    #[inline(always)]
    fn set_turn_start_time(ref self: Player, start_time: u64){
        self.turn_start_time = start_time;
    }

    #[inline(always)]
    fn dtank_supply(ref self: Player) -> u32{
        self.supply -=1;

        self.supply
    }

    #[inline(always)]
    fn dtank_supply_real(ref self: Player) -> u8{
        self.real_tank_count -=1;

        self.real_tank_count
    }

    #[inline(always)]
    fn dtank_supply_dummy(ref self: Player) -> u8{
        self.dummy_tank_count -=1;

        self.dummy_tank_count
    }
    

    #[inline(always)]
    fn flip_reveal(ref self: Player){
        self.reveal = !self.reveal;
    }
    
    
}

#[generate_trait]
impl PlayerAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Player) {
        assert(self.is_non_zero(), errors::PLAYER_NOT_EXISTS);
    }

    #[inline(always)]
    fn assert_not_exists(self: Player) {
        assert(self.is_zero(), errors::PLAYER_DOES_EXIST);
    }

    #[inline(always)]
    fn assert_has_turns(self: Player){
        assert(self.turns_remaining !=0,errors::NO_COMMANDS);
    }
}

impl ZeroablePlayer of Zeroable<Player> {
    #[inline(always)]
    fn zero() -> Player {
        Player {
            game_id: 0,
            index: 0,
            address: Zeroable::zero(),
            name: 0,
            supply: 0,
            real_tank_count: 0,    // Should always be 6
            dummy_tank_count: 0,   // Should always be 6        
            rank: 0,
            last_action: 0,
            player_score:  0,
            turns_remaining: 0,
            turn_start_time: 0,
            reveal:false,
            placements:0,
        }
    }

    #[inline(always)]
    fn is_zero(self: Player) -> bool {
        self.address == Zeroable::zero()
    }


    #[inline(always)]
    fn is_non_zero(self: Player) -> bool {
        !self.is_zero()
    }
}

