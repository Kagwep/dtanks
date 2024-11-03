
use core::debug::PrintTrait;

use starknet::testing::{set_contract_address,set_block_timestamp};

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use contracts::models::game::{Game, GameTrait};
use contracts::models::player::{Player,PlayerTrait};
use contracts::models::tile::{Tile,TileTrait};
use contracts::models::tank::{Dtank,DtankTrait};
use contracts::systems::arena::IArenaDispatcherTrait;
use contracts::systems::actions::IActionsDispatcherTrait;
use contracts::tests::setup::{setup, setup::{Systems, ARENA_HOST, PLAYER,PLAYER_TWO,PLAYER_THREE}};

#[test]
#[available_gas(10_000_000_000)]
fn test_deploy_switch_player() {


    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    let game = get!(world, game_id, Game);

    assert(game.player_count == 2, 'Game: wrong player count');
    assert(game.player() >= 0, 'Game: wrong player index');

    set_block_timestamp(1634325678);
    set_contract_address(ARENA_HOST());
    systems.arena.start(game_id,3);

    let game = get!(world, (game_id), (Game));

    assert(game.limit != 0, 'Game: Did not Start');

    
    systems.actions.deploy(game_id, 1, 14,true,'dummyone');
    systems.actions.deploy(game_id, 0, 13,true,'dummyone');
    systems.actions.deploy(game_id, 0, 12,true,'dummyone');
    systems.actions.deploy(game_id, 0, 11,true,'dummyone');
    systems.actions.deploy(game_id, 1, 11,true,'dummyone');
    systems.actions.deploy(game_id, 1, 10,true,'dummyone');

    systems.actions.deploy(game_id, 2, 14,false,'notone');
    systems.actions.deploy(game_id, 2, 13,false,'notone');
    systems.actions.deploy(game_id, 2, 12,false,'notone');
    systems.actions.deploy(game_id, 2, 11,false,'notone');
    systems.actions.deploy(game_id, 2, 19,false,'notone');
    systems.actions.deploy(game_id, 2, 10,false,'notone');

    let player = get!(world,(game_id,0),Player);

    assert(player.turns_remaining == 3, 'PLayer: Turns not consumed');

    assert(player.supply == 0, 'Dtank, Did not deploy');

    assert(player.dummy_tank_count == 0, 'Dtank, No dummy');

    let dtank = get!(world,(game_id,1,0),Dtank);

    assert(dtank.ammunition == 10, 'Dtank, doesnt exist');

    let game = get!(world, game_id, Game);

    let player = game.player();

    assert(player == 1, 'Game: Failed switch');

    set_contract_address(PLAYER());
    systems.actions.deploy(game_id, 15, 14,true,'dummyone');

}


#[test]
#[available_gas(10_000_000_000)]
fn test_deploy_switch_player_move() {


    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    let game = get!(world, game_id, Game);

    assert(game.player_count == 2, 'Game: wrong player count');
    assert(game.player() >= 0, 'Game: wrong player index');

    set_block_timestamp(1634325678);
    set_contract_address(ARENA_HOST());
    systems.arena.start(game_id,3);

    let game = get!(world, (game_id), (Game));

    assert(game.limit != 0, 'Game: Did not Start');

    
    systems.actions.deploy(game_id, 1, 14,true,'dummyone');
    systems.actions.deploy(game_id, 0, 13,true,'dummyone');
    systems.actions.deploy(game_id, 0, 12,true,'dummyone');
    systems.actions.deploy(game_id, 0, 11,true,'dummyone');
    systems.actions.deploy(game_id, 1, 11,true,'dummyone');
    systems.actions.deploy(game_id, 1, 10,true,'dummyone');

    systems.actions.deploy(game_id, 2, 14,false,'notone');
    systems.actions.deploy(game_id, 2, 13,false,'notone');
    systems.actions.deploy(game_id, 2, 12,false,'notone');
    systems.actions.deploy(game_id, 2, 11,false,'notone');
    systems.actions.shrub(game_id, 2, 19);
    systems.actions.tree(game_id, 2, 10);

    let player = get!(world,(game_id,0),Player);

    assert(player.supply == 2, 'Dtank, Did not deploy');

    assert(player.dummy_tank_count == 0, 'Dtank, No dummy');

    let dtank = get!(world,(game_id,1,0),Dtank);

    assert(dtank.ammunition == 10, 'Dtank, doesnt exist');

    let game = get!(world, game_id, Game);

    let player = game.player();

    assert(player == 1, 'Game: Failed switch');

    set_contract_address(PLAYER());
    systems.actions.deploy(game_id, 15, 14,true,'dummyone');


    systems.actions.move(game_id,11,15,15);


    let dtank = get!(world,(game_id,11,1),Dtank);

    assert(dtank.ammunition == 10, 'Dtank, doesnt exist');

    systems.actions.deploy(game_id, 15, 14,true,'dummyone');

    let player = get!(world,(game_id,1),Player);

     assert(player.turns_remaining == 9, 'Player: Player unused turn');

    let tile =  get!(world,(game_id,2,19),Tile);

     assert(tile.plants.plant_density == 200, 'Tile: Maybe Tree?')

}

#[test]
#[available_gas(10_000_000_000)]
fn test_deploy_switch_player_move_aim_fire() {


    let (world, systems) = setup::spawn_game();

    set_contract_address(ARENA_HOST());
    let game_id = systems.arena.create('felabs', 10000, 13);

    set_contract_address(PLAYER());
    systems.arena.join(game_id,'musa');

    let game = get!(world, game_id, Game);

    assert(game.player_count == 2, 'Game: wrong player count');
    assert(game.player() >= 0, 'Game: wrong player index');

    set_block_timestamp(1634325678);
    set_contract_address(ARENA_HOST());
    systems.arena.start(game_id,3);

    let game = get!(world, (game_id), (Game));

    assert(game.limit != 0, 'Game: Did not Start');

    
    systems.actions.deploy(game_id, 1, 14,true,'dummyone');
    systems.actions.deploy(game_id, 0, 13,true,'dummyone');
    systems.actions.deploy(game_id, 0, 12,true,'dummyone');
    systems.actions.deploy(game_id, 0, 11,true,'dummyone');
    systems.actions.deploy(game_id, 1, 11,true,'dummyone');
    systems.actions.deploy(game_id, 1, 10,true,'dummyone');

    systems.actions.deploy(game_id, 2, 14,false,'notone');
    systems.actions.deploy(game_id, 2, 13,false,'notone');
    systems.actions.deploy(game_id, 2, 12,false,'notone');
    systems.actions.deploy(game_id, 2, 11,false,'notone');
    systems.actions.deploy(game_id, 2, 19,false,'notone');
    systems.actions.deploy(game_id, 2, 10,false,'notone');

    let player = get!(world,(game_id,0),Player);

    assert(player.supply == 0, 'Dtank, Did not deploy');

    assert(player.dummy_tank_count == 0, 'Dtank, No dummy');

    let dtank = get!(world,(game_id,1,0),Dtank);

    assert(dtank.ammunition == 10, 'Dtank, doesnt exist');

    let game = get!(world, game_id, Game);

    let player = game.player();

    assert(player == 1, 'Game: Failed switch');

    set_contract_address(PLAYER());
    systems.actions.deploy(game_id, 15, 14,true,'dummyone');


    systems.actions.move(game_id,13,15,15);


    let dtank = get!(world,(game_id,13,1),Dtank);

    assert(dtank.ammunition == 10, 'Dtank, doesnt exist');

    systems.actions.deploy(game_id, 15, 14,true,'dummyone');

    let player = get!(world,(game_id,1),Player);

    assert(player.turns_remaining == 9, 'Player: Player unused turn');

    systems.actions.deploy(game_id, 21, 14,false,'notone');
    systems.actions.deploy(game_id, 21, 13,false,'notone');
    systems.actions.deploy(game_id, 21, 12,false,'notone');
    systems.actions.deploy(game_id, 21, 11,false,'notone');
    systems.actions.deploy(game_id, 21, 19,false,'notone');
    systems.actions.deploy(game_id, 21, 10,false,'notone');

    set_contract_address(ARENA_HOST());
    systems.actions.move(game_id,7,14,14);

    systems.actions.aim(game_id,7,13);

    let dtank = get!(world,(game_id,7,0),Dtank);

    assert(dtank.target_id  == 13, 'Dtank: Aim failed');

    systems.actions.fire(game_id,7,false,'notone');

    let dtank = get!(world,(game_id,7,0),Dtank);

    assert(dtank.ammunition == 9, 'Dtank, doesnt exist');

    set_contract_address(PLAYER());
    systems.actions.reveal(game_id,13,true,'dummyone');

    let player = get!(world,(game_id,1),Player);

    assert(player.player_score == 200, 'Attack unSuccesiful');


}