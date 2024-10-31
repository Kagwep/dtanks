import { Chain, sepolia } from "@starknet-react/chains";
import { StarknetConfig, starkscan } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import { connector } from "./config/connector";
import { WalletConnect } from "./components/WalletConnect";
import { TransferEth } from "./components/TransferEth";

function provider(chain: Chain) {
  return new RpcProvider({
    nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  });
}

function App() {
  return (
    <StarknetConfig
      autoConnect
      chains={[sepolia]}
      connectors={[connector]}
      explorer={starkscan}
      provider={provider}
    >
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Starknet Wallet Demo</h1>
        <WalletConnect />
        <TransferEth />
      </div>
    </StarknetConfig>
  );
}

export default App;