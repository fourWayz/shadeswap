"use client";

import { AleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { Network } from "@provablehq/aleo-types";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";
import { useMemo } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new LeoWalletAdapter(), new ShieldWalletAdapter()],
    [],
  );
  const programName = process.env.NEXT_PUBLIC_PROGRAM_NAME || "shadeswap_v7.aleo";

  return (
    <AleoWalletProvider
      wallets={wallets}
      network={Network.TESTNET}
      autoConnect
      decryptPermission={DecryptPermission.UponRequest}
      programs={[programName]}
      onError={(error) => console.error(error)}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </AleoWalletProvider>
  );
}
