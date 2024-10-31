use starknet::ContractAddress;
use contracts::models::position::{Position,Vec3,GridPosition};
use contracts::models::units::unit_states::AbilityState;

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
struct Dtank{
    #[key]
    game_id: u32,
    #[key]
    unit_id: u32,
    #[key]
    player_id: u32,
    ammunition: u32,
    health: u32,
    position: GridPosition,
    is_active: bool,
    target_id: u32,
    commitment: felt252,
    pending_damage: u32
}


#[generate_trait]
impl DtankImpl of DtankTrait {

    #[inline(always)]
    fn new(game_id: u32, unit_id: u32, player_id: u32, row: u32, col: u32, commitment: felt252) -> Dtank{
        Dtank{
            game_id,
            unit_id,
            player_id,
            ammunition: 10,
            health: 100,
            position: GridPosition { row, col },
            is_active: true,
            target_id: 0;
            commitment: commitment,
            pending_damage: 0,
        }
    }

    #[inline(always)]
    fn fire_gun(ref self: Dtank) {
        assert(self.is_active, 'Tank: not active');
        assert(self.ammunition > 0, 'Tank: out of ammunition');
        self.ammunition -= 1;
    }
    
    #[inline(always)]
    fn take_damage(ref self: Dtank, damage: u32) {
        if damage >= self.health {
            self.health = 0;  // Set to 0 if damage exceeds health
            self.is_active = false
            
        } else {
            self.health -= damage;
        }

        self.pending_damage = 0;
    }

    #[inline(always)]
    fn take_pending_damage(ref self: Dtank, damage: u32) {
        self.pending_damage = damage;
    }


    #[inline(always)]
    fn is_active(self: Dtank) -> bool {
        self.is_active && self.pending_damage == 0
    }

    #[inline(always)]
    fn move(ref self: Dtank,row: u32,col:u32){
        self.occupied = false;
    }

    #[inline(always)]
    fn aim(ref self: Dtank,target_id:u32){
        self.target_id = target_id;
    }

    #[inline(always)]
    fn get_row_col_info(self: Dtank) -> (row,col){
        (self.position.row,self.position.col)
    }

    #[inline(always)]
    fn tank_has_target (self: Dtank) ->bool {
        self.target_id != 0
    }

}