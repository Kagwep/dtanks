import ControllerConnector from '@cartridge/connector/controller'

const ETH_TOKEN_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

export const connector = new ControllerConnector({
  policies: [
    {
      target: ETH_TOKEN_ADDRESS,
      method: "approve",
      description: "Approve ETH transfer",
    },
    {
      target: ETH_TOKEN_ADDRESS,
      method: "transfer",
      description: "Transfer ETH",
    },
  ],
  rpc: "https://api.cartridge.gg/x/starknet/sepolia",
});
