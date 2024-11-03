import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAccount } from "@starknet-react/core";
import { useDojo } from "../dojo/useDojo";
import { useElementStore } from "../utils/dtanks";

const NetworkAccountContext = createContext(null);

export const useNetworkAccount = () => useContext(NetworkAccountContext);

export const NetworkAccountProvider = ({ children }) => {
    const network = useElementStore((state) => state.network);
    const {
        account: starknetAccount,
        status: starknetStatus,
        isConnected: starknetIsConnected,
    } = useAccount();

    // const {
    //     account: { account: katanaAccount },
    // } = useDojo();

    const accountData = useMemo(() => ({
        account: network === "slot" || "sepolia" || network === "mainnet" ? starknetAccount : null,
        address: starknetAccount?.address,
        status: network ==="slot" || "sepolia" || network === "mainnet" ? starknetStatus : "connected",
        isConnected: network === "slot" ||"sepolia" || network === "mainnet" ? starknetIsConnected : true,
    }), [network, starknetAccount, starknetStatus, starknetIsConnected]);

    return (
        <NetworkAccountContext.Provider value={accountData}>
            {children}
        </NetworkAccountContext.Provider>
    );
};
