import { MockWalletAdapter } from "./mockWalletAdapter";

export class ReviewerDemoWalletAdapter extends MockWalletAdapter {
  constructor() {
    super({
      connected: false,
      address: "DIRECT://reviewer-demo",
      chainPubkey: "reviewer-demo-chain-pubkey",
      nametag: "@reviewer-demo",
      networkId: 4,
      networkName: "testnet2",
      canSign: false,
      transport: "reviewer-demo",
      balanceLabel: "demo balance"
    });
  }
}
