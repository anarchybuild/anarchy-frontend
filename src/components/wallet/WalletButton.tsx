
import { ConnectButton } from 'thirdweb/react';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { client } from '@/config/thirdweb';

interface WalletButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "x",
        "facebook",
        "telegram",
        "discord",
        "google",
        "apple",
        "email",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

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
