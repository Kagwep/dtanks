import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector/controller";
import { useEffect, useState } from "react";

export function WalletConnect() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  const connector = connectors[0] as ControllerConnector;
  const [username, setUsername] = useState<string>();

  useEffect(() => {
    if (!address) return;
    connector.username()?.then((n) => setUsername(n));
  }, [address, connector]);

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      {address && (
        <div className="mb-4">
          <p className="text-sm">Account: {address}</p>
          {username && <p className="text-sm">Username: {username}</p>}
        </div>
      )}

      <button
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        onClick={() => {
          address ? disconnect() : connect({ connector });
        }}
      >
        {address ? "Disconnect" : "Connect Wallet"}
      </button>
    </div>
  );
}
