mod setup {


    use core::debug::PrintTrait;
    use starknet::ContractAddress;
    use starknet::testing::set_contract_address;

    use dojo::world::{IWorldDispatcherTrait, IWorldDispatcher};
    use dojo::test_utils::{spawn_test_world, deploy_contract};
    use contracts::models::game::{game, Game};
    use contracts::models::player::{player, Player};
    use contracts::systems::arena::{arena, IArenaDispatcher};
    use contracts::systems::actions::{actions, IActionsDispatcher};
    use contracts::models::tile::{tile, Tile};



    

    fn ARENA_HOST() -> ContractAddress {
        starknet::contract_address_const::<'ARENA_HOST'>()
    }

    fn PLAYER() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER'>()
    }

    fn PLAYER_TWO() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER_TWO'>()
    }

    fn PLAYER_THREE() -> ContractAddress {
        starknet::contract_address_const::<'PLAYER_THREE'>()
    }




    #[derive(Copy, Drop)]
    struct Systems {
        arena: IArenaDispatcher,
        actions: IActionsDispatcher,
    }


    fn spawn_game() -> (IWorldDispatcher, Systems) {

        // [Setup] World
        let mut models = core::array::ArrayTrait::new();

        models.append(game::TEST_CLASS_HASH);
        models.append(player::TEST_CLASS_HASH);
        models.append(tile::TEST_CLASS_HASH);
 

        let world = spawn_test_world(models);
    
        // [Setup] Systems
        let arena_address = world.deploy_contract('salt',arena::TEST_CLASS_HASH.try_into().unwrap(), array![].span());
        let actions_address = world.deploy_contract('salt_two',actions::TEST_CLASS_HASH.try_into().unwrap(), array![].span());

        let systems = Systems {
            arena: IArenaDispatcher { contract_address: arena_address },
            actions: IActionsDispatcher { contract_address: actions_address },
        };

        // [Return]
        (world, systems)
    }
}
