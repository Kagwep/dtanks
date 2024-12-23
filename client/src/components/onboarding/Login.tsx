import { useEffect, useState } from "react";

import { FaCheckCircle } from "react-icons/fa";
import WalletSection from "./Sections/WalletSection";
// import EthSection from "./Sections/EthSection";
// import { ScreenPage, useElementStore } from "../../utils/nexus";
// import { ETH_PREFUND_AMOUNT } from "../../lib/constants";
// import { checkCartridgeConnector } from "../../lib/connectors";
// import { useConnect } from "@starknet-react/core";

interface LoginProps {
  onOnboardComplete: () => void;
}

const Login = ({
  onOnboardComplete
}: LoginProps) => {

  
  
  return (
    <>
    <div className="min-h-screen  flex flex-col items-center "  style={{
      backgroundImage: 'url("https://res.cloudinary.com/dydj8hnhz/image/upload/v1730413962/j5hj0ewsdlfcmghtze6p.webp")',
      backgroundSize: 'cover',
     
    }} >
      <div className="flex flex-col items-center gap-5 py-20 sm:p-0">
          <div className="hidden sm:flex flex-row h-5/6 gap-5">
            <div className="flex flex-col items-center ">
              <h2 className="m-0">1</h2>
              <div className="relative z-1 px-2 sm:px-0">
                <WalletSection onOnboardComplete={onOnboardComplete} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
