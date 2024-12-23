use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use contracts::models::game::{Game, GameTrait, GameAssert};
use contracts::models::player::{Player,PlayerTrait};
use contracts::models::tile::{Tile,TileTrait};

// define the interface
#[dojo::interface]
trait IActions {
    fn deploy(ref world: IWorldDispatcher,game_id: u32, row: u32, col: u32,is_dummy: bool, salt: felt252);
    fn move(ref world: IWorldDispatcher,game_id: u32,unit_id: u32, row: u32, col: u32);
    fn aim(ref world: IWorldDispatcher,game_id: u32,unit_id: u32,target_id: u32);
    fn fire(ref world: IWorldDispatcher,game_id: u32,unit_id: u32,is_dummy: bool, salt: felt252);
    fn reveal(ref world: IWorldDispatcher,game_id: u32,unit_id: u32,is_dummy: bool, salt: felt252);
    fn shrub(ref world: IWorldDispatcher,game_id: u32, row: u32, col: u32);
    fn tree(ref world: IWorldDispatcher,game_id: u32, row: u32, col: u32);
}


#[dojo::interface]
trait IActionsInternal {

    fn _handle_player_checks(
        ref world: IWorldDispatcher,
        game: Game,
        caller: ContractAddress
    ) -> Player;

    fn _get_damage(
        ref world: IWorldDispatcher,
        game_id: u32,
        source_row: u32,
        source_col: u32,
        target_row: u32,
        target_col: u32,
    ) -> u32;


    fn _validate_path(
        ref world: IWorldDispatcher,
        game_id: u32,
        source_row: u32,
        source_col: u32,
        target_row: u32,
        target_col: u32,
    ) -> bool;

    fn _check_switch_player(
        ref world: IWorldDispatcher,
        player: Player,
        game: Game
    ) -> (Player,Game);

    fn _get_tile(
        ref world: IWorldDispatcher,
        game_id: u32,
        row: u32,
        col: u32
    ) -> Tile;

}


// dojo decorator
#[dojo::contract]
mod actions {
    use super::{IActions};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use contracts::models::tank::{Dtank, DtankTrait};
    use contracts::models::tile::{Tile, TileTrait};
    use contracts::utils::helper::{HelperTrait};
    use contracts::models::player::{Player,PlayerTrait,AssertTrait};
    use contracts::models::game::{Game, GameTrait, GameAssert};
    use contracts::constants::{ROW,COL,TREE_DAMAGE,PLANT_DAMAGE,INITIAL_HEALTH,MAX_MOVE_DISTANCE,POINTS_FOR_REAL_TANK_KILL,POINTS_FOR_ATTACKING_DUMMY,WIN_THRESHOLD,MIDDLE_ROW};


    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {

        fn deploy(ref world: IWorldDispatcher,game_id: u32, row: u32, col: u32,is_dummy: bool, salt: felt252){


            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));

            if game.dtanks_host == caller {
                assert(row < MIDDLE_ROW, 'Cannot Deploy');
            }else {
                assert(row >= MIDDLE_ROW, 'Cannot Deploy');
            }

            let mut tile =  self._get_tile(game_id,row,col);

            assert(tile.can_deploy(),'TILE: Cannot deploy');

            // player checks
            let mut player =self._handle_player_checks(
                game,
                caller
            );

            assert(player.supply > 0, 'Player: No supply');

            if is_dummy {
                assert(player.dummy_tank_count > 0, 'Player: No Dummies');
            }else{
                assert(player.real_tank_count > 0 ,'Player: No  Tanks')
            }
            

            let commitment = HelperTrait::generate_poseidon_commitment(is_dummy, salt);

            let unit_id = game.add_unit();
            
            let dtank = DtankTrait::new(game_id, unit_id, player.index, row,col,commitment);

            player.dtank_supply();

            if is_dummy {
                player.dtank_supply_dummy();
            }else{
                player.dtank_supply_real();
            }

            player.use_turn();

            let (mut player,game) = self._check_switch_player(player,game);

    
            tile.deploy();

            set!(world,(game,dtank,tile,player));

            
        }

        fn move(ref world: IWorldDispatcher,game_id: u32,unit_id: u32, row: u32, col: u32){


            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));
            
            // player checks
            let mut player = self._handle_player_checks(
                game,
                caller
            );

            let mut tile = self._get_tile(game_id,row,col);

            assert(tile.can_deploy(),'TILE: Cannot deploy');

            let mut dtank = get!(world,(game.game_id,unit_id,player.index),Dtank);


            assert(dtank.is_dtank_active(), 'Dtank: Not active');

            let mut previous_tile = get!(world,(game_id,dtank.position.row,dtank.position.col),Tile);

            dtank.move(row,col);

            tile.deploy();

            previous_tile.move();

            player.use_turn();

            let (player,game) = self._check_switch_player(player,game);

            set!(world,(game,tile,dtank,player,previous_tile));


        }

        fn aim(ref world: IWorldDispatcher,game_id: u32,unit_id: u32,target_id: u32){

            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));

            // player checks
            let mut player = self._handle_player_checks(
                game,
                caller
            );

            let mut dtank = get!(world,(game.game_id,unit_id,player.index),Dtank);

            assert(dtank.is_dtank_active(), 'Dtank: Not active');

            dtank.aim(target_id);

            player.use_turn();

            let (player,game) = self._check_switch_player(player,game);

            set!(world,(game,dtank,player));

        }

        fn fire(ref world: IWorldDispatcher,game_id: u32,unit_id: u32,is_dummy: bool, salt: felt252){

            assert(!is_dummy, 'Dtank: Dummy');

            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));

            // player checks
           let mut player = self._handle_player_checks(
                game,
                caller
            );

            let mut dtank = get!(world,(game.game_id,unit_id,player.index),Dtank);

            assert(dtank.is_dtank_active(), 'Dtank: Not active');

            assert(dtank.tank_has_target(), 'Dtank: No target');

            let opponent_id = if player.index == 0{
                1_u32
            }else{
                0_u32
            };

            let mut target_dtank = get!(world,(game.game_id,dtank.target_id,opponent_id),Dtank);

            let (target_row,target_col) = target_dtank.get_row_col_info();

            //let tile = get!(world,(game.game_id,row,col),Tile);

            assert(self._validate_path(
                game.game_id,
                dtank.position.row,
                dtank.position.col,
                target_row,
                target_col,
            ),'Path: inavlid');

            let damage = self._get_damage(
                game.game_id,
                dtank.position.row,
                dtank.position.col,
                target_row,
                target_col,
            );

            dtank.fire_gun();

            target_dtank.take_pending_damage(damage);

            player.use_turn();

            let (player,game) = self._check_switch_player(player,game);

            let mut op_player = get!(world,(game_id,opponent_id),Player);

            op_player.flip_reveal();

            set!(world,(game,target_dtank,dtank,player,op_player));

        }

        fn reveal(ref world: IWorldDispatcher,game_id: u32,unit_id: u32,is_dummy: bool, salt: felt252){

            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));

            // player checks
            assert(game.over == false, 'Game: Game over');
            // get the player
            let mut player = match HelperTrait::find_player(world,game, caller) {
                Option::Some(player) => player,
                Option::None => panic(array!['PLayer does not exist']),
            };

            player.assert_exists();

            player.assert_has_turns();

            let time = get_block_timestamp();

            assert(!player.is_turn_timed_out(time), 'Turn Timeout');

            let mut dtank = get!(world,(game.game_id,unit_id,player.index),Dtank);

            assert(dtank.pending_damage > 0, 'Dtank:  No pending damage');

            // Verify commitment
            let calculated_commitment = HelperTrait::generate_poseidon_commitment(is_dummy, salt);
            assert(calculated_commitment == dtank.commitment, 'invalid reveal');

            // Calculate final damage
            if is_dummy {

                player.player_score += POINTS_FOR_ATTACKING_DUMMY;

                player.flip_reveal();

                if player.player_score >= WIN_THRESHOLD {

                    game.over = true;
                    game.winner = player.address;

                    set!(world,(game));
                }

                set!(world,(dtank,player));

            }else{

                let attacker_id = game.next_player();

                let mut attacker = get!(world,(game.game_id,attacker_id),Player);

                attacker.player_score += POINTS_FOR_REAL_TANK_KILL;

                dtank.take_damage(dtank.pending_damage);

                if attacker.player_score >= WIN_THRESHOLD {

                    game.over = true;
                    game.winner = attacker.address;

                    set!(world,(game));
                
                }

                player.flip_reveal();

                set!(world,(dtank,player,attacker));

            }


        }

        fn shrub(ref world: IWorldDispatcher,game_id: u32, row: u32, col: u32){

            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));

            // player checks
           let mut player = self._handle_player_checks(
                game,
                caller
            );

            assert(player.placements > 0, 'Tile, Placements Depleted');

            let mut tile =  self._get_tile(game_id,row,col);
            tile.add_plant_to_grid(200);

            player.use_turn();

            player.consume_placements();

            let (mut player,game) = self._check_switch_player(player,game);

            set!(world, (tile,game,player));
        }
        fn tree(ref world: IWorldDispatcher,game_id: u32, row: u32, col: u32){

            let caller = get_caller_address();

            let mut game = get!(world,game_id,(Game));

            // player checks
           let mut player = self._handle_player_checks(
                game,
                caller
            );

            assert(player.placements > 0, 'Tile, Placements Depleted');

            let mut tile = self._get_tile(game_id,row,col);
            tile.add_plant_tree_to_grid(2000); // TODO: Make this configurable
         

            player.use_turn();

            player.consume_placements();

            let (mut player,game) = self._check_switch_player(player,game);

            

            set!(world, (tile,game,player));
        }

    }

    impl ActionsInternalImpl of super::IActionsInternal<ContractState> {
        // Function to handle unit type-specific operations
        fn _handle_player_checks(
            ref world: IWorldDispatcher,
            game: Game,
            caller: ContractAddress
        ) -> Player{

            assert(game.over == false, 'Game: Game over');
            // get the player
            let mut player = match HelperTrait::find_player(world,game, caller) {
                Option::Some(player) => player,
                Option::None => panic(array!['PLayer does not exist']),
            };

            assert(game.player() == player.index, 'Game: Not Your Turn');

            player.assert_exists();

            player.assert_has_turns();

            let time = get_block_timestamp();

            assert(!player.is_turn_timed_out(time), 'Turn Timeout');

            assert(!player.reveal, 'Player: You have a reveal');

            player

        }


    fn _get_damage(
        ref world: IWorldDispatcher,
        game_id: u32,
        source_row: u32,
        source_col: u32,
        target_row: u32,
        target_col: u32,
    ) -> u32 {
        // Track two types of health/damage
        let mut nature_resistance = INITIAL_HEALTH;
        let mut structure_resistance = INITIAL_HEALTH;
        
        // Start from source (excluding it)
        let mut current_row = source_row;
        let mut current_col = source_col;
        
        loop {
            // Move towards target
            if current_row < target_row {
                current_row += 1;
            } else if current_row > target_row {
                current_row = current_row - 1;
            }

            if current_col < target_col {
                current_col += 1;
            } else if current_col > target_col {
                current_col = current_col - 1;
            }

            // Check if we've reached the target
            if current_row == target_row && current_col == target_col {
                break;
            }

            let tile = self._get_tile(game_id,current_row,current_col);
            
            // Apply damage from plants (nature resistance)
            if tile.tile_has_plant_path() && nature_resistance >= PLANT_DAMAGE {
                nature_resistance -= PLANT_DAMAGE;
            }
            
            // Apply damage from trees (structure resistance)
            if tile.tile_has_tree() && structure_resistance >= TREE_DAMAGE {
                structure_resistance -= TREE_DAMAGE;
            }
        };

        // Return average of both resistances
        (nature_resistance + structure_resistance) / 2
    }

        fn _validate_path(
            ref world: IWorldDispatcher,
            game_id: u32,
            source_row: u32,
            source_col: u32,
            target_row: u32,
            target_col: u32,
        )-> bool{

             let row_diff = if target_row >= source_row {
                target_row - source_row
             }else {
                source_row - target_row
             };

             let col_diff = if target_col >= source_col{
                target_col - source_col
             }else{
                source_col - target_col
             };

             //check if movement is zero 

             if row_diff == 0 && col_diff == 0 {
                return false;
             }

             if row_diff > MAX_MOVE_DISTANCE || col_diff > MAX_MOVE_DISTANCE {
                return false;
             }

            // Check if movement is valid (horizontal, vertical, or diagonal)
            let is_horizontal = row_diff == 0 && col_diff > 0;
            let is_vertical = col_diff == 0 && row_diff > 0;
            let is_diagonal = row_diff == col_diff;


            // Return true only if move is valid and target is free
            (is_horizontal || is_vertical || is_diagonal) 

        }

        fn _check_switch_player(
            ref world: IWorldDispatcher,
            mut player: Player,
            mut game:Game
        ) -> (Player,Game) {
            
            let remaining_turns = player.turns_remaining;

            if remaining_turns == 0 {

                game.advance_turn();
                player.reset_moves();

                let time = get_block_timestamp();

                let mut new_player = HelperTrait::current_player(world,game);
                new_player.set_turn_start_time(time);
                set!(world,(new_player));

                return (player,game);

            }

            set!(world,(player));

            (player,game)
        }


        fn _get_tile(
            ref world: IWorldDispatcher,
            game_id: u32,
            row: u32,
            col: u32
        ) -> Tile{
            let mut tile = get!(world,(game_id,row,col),Tile);

            if tile.size != 0 {
                return tile;
            }else{
                return TileTrait::new(game_id, row, col, 0);
            }
        }
    }
}

