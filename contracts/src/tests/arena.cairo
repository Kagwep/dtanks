
use core::debug::PrintTrait;

use starknet::testing::{set_contract_address,set_block_timestamp};

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use contracts::models::game::{Game, GameTrait};
use contracts::models::player::{Player,PlayerTrait};
use contracts::models::tile::{Tile,TileTrait};
use contracts::systems::arena::IArenaDispatcherTrait;
use contracts::systems::actions::IActionsDispatcherTrait;
use contracts::tests::setup::{setup, setup::{Systems, ARENA_HOST, PLAYER,PLAYER_TWO,PLAYER_THREE}};

#[test]
#[available_gas(30000000)]
fn test_create() {


    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    let game = get!(world, game_id, Game);

    assert(game.game_id == 0, 'Game: wrong id');
    assert(game.player_name == 'felabs', 'Not name of Creator');
    assert(game.price == 10000, 'Wrong price');
    assert(game.player_count == 1, 'Game: wrong player count');


}


#[test]
#[available_gas(1_000_000_000)]
fn test_join() {


    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    let game = get!(world, game_id, Game);

    assert(game.player_count == 2, 'Game: wrong player count');
    assert(game.player() >= 0, 'Game: wrong player index');



}



#[test]
#[available_gas(1_000_000_000)]
fn test_leave() {

    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    let game = get!(world, game_id, Game);

    assert(game.player_count == 2, 'Game: wrong player count');
    assert(game.player() >= 0, 'Game: wrong player index');

    set_contract_address(PLAYER());
    systems.arena.leave(game_id);

    let mut player_index: u32 = 1;
    
    let player = get!(world,(game_id,player_index),Player);

    let game = get!(world, game_id, Game);
    assert(game.player_count == 1, 'Game: wrong player count');



}

#[test]
#[available_gas(1_000_000_000)]
fn test_kick() {

    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    let game = get!(world, game_id, Game);

    assert(game.player_count == 2, 'Game: wrong player count');
    assert(game.player() >= 0, 'Game: wrong player index');


    let mut player_index: u32 = 1;
    
    let player = get!(world,(game_id,player_index),Player);

    set_contract_address(ARENA_HOST());
    systems.arena.kick(game_id,player.index);

    let game = get!(world, game_id, Game);
    assert(game.player_count == 1, 'Game: wrong player count');

}

#[test]
#[available_gas(1_000_000_000)]
fn test_delete() {

    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(ARENA_HOST());
    systems.arena.delete(game_id);


    let game = get!(world,(game_id), (Game));

    assert(game.player_count == 0, 'Game: wrong player count');
}

#[test]
#[available_gas(10_000_000_000)]
fn test_start() {

    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    set_block_timestamp(1634325678);
    set_contract_address(ARENA_HOST());
    systems.arena.start(game_id,3);

    let game = get!(world, (game_id), (Game));

    assert(game.limit != 0, 'Game: Did not Start');

    let mut player_index: u32 = 0;
    
    let player = get!(world,(game_id,player_index),Player);

    assert(player.turn_start_time != 0, 'Player time not initialized');

    // self._handle_tile_plant_add( game.game_id, 1, 1, 7, 7, 200, 'bottom');
    // self._handle_tile_plant_add( game.game_id, 1, 11, 7, 17, 200, 'bottom');
    // self._handle_tile_plant_add( game.game_id, 1, 21, 7, 27, 200, 'bottom');

    let mut tile =  get!(world,(game_id,1,4),Tile);

    assert(tile.plants.plant_density== 200, 'Tile: Maybe Tree?')


}

