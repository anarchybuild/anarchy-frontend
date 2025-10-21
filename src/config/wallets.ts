import { inAppWallet, createWallet } from "thirdweb/wallets";

// Centralized wallets configuration for Thirdweb connect
export const wallets = [
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
