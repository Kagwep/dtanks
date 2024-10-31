import { useAccount, useExplorer } from "@starknet-react/core";
import { useCallback, useState } from "react";

const ETH_CONTRACT =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

export function TransferEth() {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { account } = useAccount();
  const explorer = useExplorer();
  const [txnHash, setTxnHash] = useState<string>();

  console.log(account)

  const execute = useCallback(
    async (amount: string) => {
      if (!account) return;
      
      setSubmitted(true);
      setTxnHash(undefined);

      try {
        const result = await account.execute([
          {
            contractAddress: ETH_CONTRACT,
            entrypoint: "approve",
            calldata: [account?.address, amount, "0x0"],
          },
          {
            contractAddress: ETH_CONTRACT,
            entrypoint: "transfer",
            calldata: [account?.address, amount, "0x0"],
          },
        ]);
        setTxnHash(result.transaction_hash);
      } catch (e) {
        console.error(e);
      } finally {
        setSubmitted(false);
      }
    },
    [account]
  );

  if (!account) return null;

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Transfer ETH</h2>
      <p className="text-sm mb-4">Contract: {ETH_CONTRACT}</p>
      <button
        className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400"
        onClick={() => execute("0x1C6BF52634000")}
        disabled={submitted}
      >
        Transfer 0.005 ETH to self
      </button>
      {txnHash && (
        <p className="mt-4 text-sm">
          Transaction hash:{" "}
          <a
            href={explorer.transaction(txnHash)}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            {txnHash}
          </a>
        </p>
      )}
    </div>
  );
}