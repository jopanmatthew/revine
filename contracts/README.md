# revine. contracts

Foundry contracts for the Sepolia v26.0 demo. The deploy script currently uses
`AlwaysTrueVerifier` for both proof interfaces, as specified for fingerprint
mode before P1/P2. Do not describe this deployment as having verified ZK proofs.

For a wallet-signed deployment that keeps the private key inside MetaMask, use
the flattened Remix sources and instructions in [`remix/README.md`](remix/README.md).

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.7.0 --no-git --shallow
forge install foundry-rs/forge-std@v1.9.7 --no-git --shallow
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify
```

For Foundry script deployment, copy `.env.example` to `.env` and fill in the
deployer key, Sepolia RPC URL and Etherscan API key. The named `sepolia` RPC
endpoint reads `SEPOLIA_RPC_URL` from this file; no shell export or sourcing is
needed. Optional demo wallet keys let the deploy script submit one `faucet()`
transaction for each wallet. Without them, each wallet can call the
permissionless faucet directly.

The deploy script broadcasts transactions. Once the accounts and environment
are configured, first check a simulation with the same command without
`--broadcast --verify`.

The Foundry dependencies are pinned to OpenZeppelin Contracts v5.7.0 and
forge-std v1.9.7.
