
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/config/thirdweb';
import { wallets } from '@/config/wallets';

interface WalletButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

// wallets imported from config

const WalletButton = ({ className, size = "sm" }: WalletButtonProps) => {
  return (
    <div className="scale-90">
      <ConnectButton
        client={client}
        connectButton={{ label: "Sign in" }}
        connectModal={{
          privacyPolicyUrl: "/privacy",
          showThirdwebBranding: false,
          size: "compact",
          termsOfServiceUrl: "/terms",
        }}
        wallets={wallets}
        theme="dark"
      />
    </div>
  );
};

export default WalletButton;
