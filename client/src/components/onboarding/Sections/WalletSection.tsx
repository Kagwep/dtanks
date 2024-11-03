import { Button } from "../../components/buttons/Button";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useElementStore } from "../../../utils/dtanks";
import React, { useEffect } from "react";


interface WalletSectionProps {
  onOnboardComplete: () => void;
}

const WalletSection: React.FC<WalletSectionProps> = ({onOnboardComplete}) => {
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, isConnected, account,status } = useAccount();

  const cartridgeConnector = connectors[0]

  const {
    setLoginScreen,
    setScreen,
    handleOnboarded,
    setNetwork,
    setIsMuted,
    isMuted,
  } = useElementStore();

  useEffect(() => {
    if (isConnected && address) {
      console.log("Controller connected:", address, account);
      onOnboardComplete();
      setLoginScreen(false);
    }
  }, [isConnected, address, onOnboardComplete]);

  return (
    <>
      <div className="flex flex-col items-center justify-between border border-terminal-green p-5 text-center gap-10 z-1 h-[400px] sm:h-[425px] 2xl:h-[500px] bg-green-800 text-slate-100">
        <h4 className="text-4xl font-bold text-terminal-green mb-6 uppercase text-center">Login</h4>
        <p className="text-terminal-green mb-8 text-center">
          Connect with Cartridge Controller to play
        </p>
        
        {/* Desktop version */}
        <div className="hidden sm:flex flex-col">
          <Button
            className="text-orange-600"
            onClick={() => {
              if (account) {
                disconnect()
                return
              }
              connect({ connector: cartridgeConnector })
            }}
          >
            Login
          </Button>
        </div>

        {/* Mobile version */}
        <div className="sm:hidden flex flex-col gap-2">
          <Button
            size={"lg"}
            onClick={() => {
              if (account) {
                disconnect()
                return
              }
              connect({ connector: cartridgeConnector })
            }}
          >
            Login with Cartridge Controller
          </Button>
        </div>
      </div>
    </>
  );
};

export default WalletSection;