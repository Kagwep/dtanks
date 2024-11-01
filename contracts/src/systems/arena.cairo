
#[dojo::interface]
trait IArena {
    fn create( ref world: IWorldDispatcher,
        player_name: felt252,
        price: u256,
        penalty: u64
    ) -> u32;
    fn join(ref world: IWorldDispatcher,game_id: u32, player_name: felt252);
    fn transfer(ref world: IWorldDispatcher, game_id: u32, index: u32);
    fn leave(ref world: IWorldDispatcher, game_id: u32);
    fn start(ref world: IWorldDispatcher, game_id: u32, round_count: u32);
    fn delete(ref world: IWorldDispatcher, game_id: u32);
    fn kick(ref world: IWorldDispatcher, game_id: u32, index: u32);
}


#[dojo::interface]
trait IArenaInternal {

    fn _handle_tile_plant_add(
        ref world: IWorldDispatcher,
        game_id: u32,
        start_row: u32,
        start_col: u32,
        end_row: u32,
        end_col: u32, 
        plant_density: u32, 
        gate_position: felt252
    );


    fn _handle_is_gate(
        ref world: IWorldDispatcher,
        row: u32,
        col: u32,
        start_row: u32,
        start_col: u32,
        end_row: u32,
        end_col: u32, 
        gate_position: felt252
    ) -> bool;

}

// System implementation

#[dojo::contract]
mod arena {
    // Starknet imports

    use super::{IArena};

    use starknet::{
        ContractAddress, get_caller_address, get_contract_address, get_block_timestamp,get_block_number,
        contract_address_try_from_felt252
    };

    use contracts::models::game::{Game, GameTrait, GameAssert};
    use contracts::models::player::{Player, PlayerTrait, PlayerAssert};
    use contracts::utils::helper::{HelperTrait};
    use contracts::constants::{ROW,COL};
    use contracts::models::tile::{Tile,TileTrait};
    use core::poseidon::PoseidonTrait;
    use core::poseidon::poseidon_hash_span;
    use core::hash::{HashStateTrait, HashStateExTrait};

    mod errors {
        const ERC20_REWARD_FAILED: felt252 = 'ERC20: reward failed';
        const ERC20_PAY_FAILED: felt252 = 'ERC20: pay failed';
        const ERC20_REFUND_FAILED: felt252 = 'ERC20: refund failed';
        const HOST_PLAYER_ALREADY_IN_LOBBY: felt252 = 'Host: player already in lobby';
        const HOST_PLAYER_NOT_IN_LOBBY: felt252 = 'Host: player not in lobby';
        const HOST_CALLER_IS_NOT_THE_HOST: felt252 = 'Host: caller is not the arena';
        const HOST_MAX_NB_PLAYERS_IS_TOO_LOW: felt252 = 'Host: max player numbers is < 2';
        const HOST_GAME_NOT_OVER: felt252 = 'Host: game not over';
    }

    

    #[abi(embed_v0)]
    impl ArenaImpl of IArena<ContractState> {
        fn create(
            ref world: IWorldDispatcher,
            player_name: felt252,
            price: u256,
            penalty: u64,
        ) -> u32 {
          
            let caller = get_caller_address();
        

            // [Effect] Game
            let game_id = world.uuid();
            let mut game = GameTrait::new(
                game_id: game_id, dtanks_host: caller, price: price, penalty: penalty,player_name: player_name
            );

            let player_index: u32 = game.join_game().into();

            set!(world, (game));

            // [Effect] Player
            let player = PlayerTrait::new(
                game_id, index: player_index, address: caller, name: player_name
            );

            set!(world, (player));

            // [Return] Game id
            game_id
        }

        fn join(ref world: IWorldDispatcher, game_id: u32, player_name: felt252) {

            // [Check] Player not in lobby
            let mut game = get!(world, game_id, (Game));

            let caller = get_caller_address();

            match HelperTrait::find_player(world,game, caller) {
                Option::Some(_) => panic(array![errors::HOST_PLAYER_ALREADY_IN_LOBBY]),
                Option::None => (),
            };

            // [Effect] Game
            let player_index: u32 = game.join_game().into();

            set!(world, (game));

            // [Effect] Player
            let player = PlayerTrait::new(
                game_id, index: player_index, address: caller, name: player_name
            );

            set!(world, (player));

        }


        fn transfer(ref world: IWorldDispatcher, game_id: u32, index: u32) {

            // [Check] Caller is the host
            let mut game = get!(world, game_id, Game);

            let caller = get_caller_address();

            game.assert_is_host(caller);

            // [Check] Player exists
            let mut player = get!(world,(game_id,index),Player);
            player.assert_exists();

            // [Effect] Update Game
            game.transfer(player.address);
            
            set!(world,(game));
        }

        fn leave(ref world: IWorldDispatcher, game_id: u32,) {

            // [Check] Player in lobby
            let mut game = get!(world, game_id, (Game));
            let caller = get_caller_address();

            let mut player = match HelperTrait::find_player(world,game, caller) {
                Option::Some(player) => player,
                Option::None => panic(array![errors::HOST_PLAYER_NOT_IN_LOBBY]),
            };
                     
            // [Effect] Update Game
            let last_index = game.leave(caller);

            set!(world, (game));

            // [Effect] Update Player
            
            let mut last_player = get!(world, (game.game_id, last_index), (Player));
            
            if last_player.index != player.index {
                last_player.index = player.index;
                set!(world, (last_player));
            }

            // [Effect] Update Player
            player.nullify();
            set!(world, (player));
        }

        fn kick(ref world: IWorldDispatcher, game_id: u32, index: u32) {

            // [Check] Caller is the arena
            let mut game = get!(world, game_id, (Game));
            let caller = get_caller_address();
            game.assert_is_host(caller.into());

            // [Check] Player exists
            let mut player = get!(world, (game.game_id, index), (Player));
            player.assert_exists();

            // [Effect] Update Game
            let last_index = game.kick(player.address);
            set!(world, (game));

            // [Effect] Update last Player
            let mut last_player = get!(world, (game.game_id, last_index), (Player));
            if last_player.index != player.index {
                last_player.index = player.index;
                set!(world, (last_player));
            }

            // [Effect] Update Player
            player.nullify();
            set!(world, (player));
        }

        fn delete(ref world: IWorldDispatcher, game_id: u32) {


            // [Check] Player exists
            let mut game = get!(world, game_id, (Game));
            let caller = get_caller_address();
            let mut player = match HelperTrait::find_player(world,game, caller) {
                Option::Some(player) => player,
                Option::None => panic(array![errors::HOST_PLAYER_NOT_IN_LOBBY]),
            };

            player.assert_exists();
            
            // [Effect] Update Game

            game.delete(player.address);
            set!(world, (game));

            // [Effect] Update Player
            player.nullify();
            set!(world, (player));
        }

        fn start(ref world: IWorldDispatcher, game_id: u32, round_count: u32) {

            // [Check] Caller is the arena
            let mut game = get!(world, game_id, (Game));
            let caller = get_caller_address();
            game.assert_is_host(caller);

            // [Effect] Start game
            let mut addresses = array![];
            let mut players = HelperTrait::players(world,game);
            loop {
                match players.pop_front() {
                    Option::Some(player) => { addresses.append(player.address); },
                    Option::None => { break; },
                };
            };

            // [Effect] Update Game
            let time = get_block_timestamp();

            game.start(time, round_count, addresses);

            let player_index = game.player();
            let mut player = get!(world, (game_id, player_index), Player);

            player.set_turn_start_time(time);

            let mut i: u32 = 0;
            while i < ROW {
                let mut j: u32 = 0;
                while j < COL {
                    let tile = TileTrait::new(game_id, i, j, 0);
                    set!(world, (tile));
                    j += 1;
                };
                i += 1;
            };

            // TODO: Make this configurable
            self._handle_tile_plant_add( game.game_id, 1, 1, 7, 7, 200, 'bottom');
            self._handle_tile_plant_add( game.game_id, 1, 11, 7, 17, 200, 'bottom');
            self._handle_tile_plant_add( game.game_id, 1, 21, 7, 27, 200, 'bottom');
        
            // Middle row
            self._handle_tile_plant_add( game.game_id, 11, 1, 19, 9, 250, 'right');
            self._handle_tile_plant_add( game.game_id, 11, 19, 19, 27, 250, 'left');
        
            // Bottom row
            self._handle_tile_plant_add( game.game_id, 23, 1, 29, 7, 200, 'top');
            self._handle_tile_plant_add( game.game_id, 23, 11, 29, 17, 200, 'top');
            self._handle_tile_plant_add( game.game_id, 23, 21, 29, 27, 200, 'top');

            //^

                    // Add additional trees in open areas
            let mut i: u32 = 0;
            while i < ROW {
                       let mut j: u32 = 0;
                       while j < COL {
                           let mut state = PoseidonTrait::new();
                           state.update(game_id.into());
                           state.update(i.into());  // Changed from row to i
                           state.update(j.into());  // Changed from col to j
                            // Add more entropy sources
                              // Use world nonce if available
                            //  state.update(get_tx_hash().into()); 
                            state.update(get_caller_address().into());
                            state.update(get_block_timestamp().try_into().unwrap());  // Current block timestamp
                            state.update(get_block_number().try_into().unwrap());     // Current block number
                            let hash = state.finalize();

                            
                           
                            // Convert felt252 to u256 first, then to u128
                            let hash_u256: u256 = hash.into();
                            let random_value = (hash_u256.low % 100_u128);  // Using low part of u256

                       
                            
                           // 20% chance (values 0-19)
                           if random_value < 20 {
                               let mut tile = get!(world, (game.game_id, i, j), Tile);  // Changed from row,col to i,j
                               tile.add_plant_tree_to_grid(2000); // TODO: Make this configurable
                               set!(world, (tile));
                           }
                           j += 1;
                       };
                       i += 1;
                    };
                    
            set!(world, (game));
            set!(world,(player));

        }

    }


    impl ArenaInternalImpl of super::IArenaInternal<ContractState> {
        // Function to handle unit type-specific operations
        fn _handle_tile_plant_add(
            ref world: IWorldDispatcher,
            game_id: u32,
            start_row: u32,
            start_col: u32,
            end_row: u32,
            end_col: u32, 
            plant_density: u32, 
            gate_position: felt252
        ) {
            let mut row = start_row;
            while row < end_row + 1 {
                let mut col = start_col;
                while col < end_col + 1 {
                    if row == start_row || row == end_row || col == start_col || col == end_col {

                       
                        // Border tiles
                        if !self._handle_is_gate(row, col, start_row, start_col, end_row, end_col, gate_position) {
                           
                            let mut tile = get!(world, (game_id, row, col), Tile);
                            tile.add_plant_to_grid(plant_density);
                            set!(world, (tile));
                        }
                    } else {
                        // Interior tiles - use Poseidon hash for deterministic "randomness"
                        let mut state = PoseidonTrait::new();
                        state.update(game_id.into());
                        state.update(row.into());
                        state.update(col.into());
                        let hash = state.finalize();
                        
                        // Convert felt252 to u256 first, then to u128
                        let hash_u256: u256 = hash.into();
                        let random_value = (hash_u256.low % 100_u128);  // Using low part of u256

                        
                        // 20% chance (values 0-19)
                        if random_value < 20 {
                            let mut tile = get!(world, (game_id, row, col), Tile);
                            tile.add_plant_tree_to_grid(2000); // TODO: Make this configurable
                            set!(world, (tile));
                        }
                    }
                    col += 1;
                };
                row += 1;
            };
        }
    
        fn _handle_is_gate(
            ref world: IWorldDispatcher,
            row: u32,
            col: u32,
            start_row: u32,
            start_col: u32,
            end_row: u32,
            end_col: u32, 
            gate_position: felt252
        ) -> bool {
            let mid_col = (start_col + end_col) / 2;
            let mid_row = (start_row + end_row) / 2;
            
            if gate_position == 'top' {
                row == start_row && col == mid_col
            } else if gate_position == 'bottom' {
                row == end_row && col == mid_col
            } else if gate_position == 'left' {
                col == start_col && row == mid_row
            } else if gate_position == 'right' {
                col == end_col && row == mid_row
            } else {
                false
            }
        }

    }
}
