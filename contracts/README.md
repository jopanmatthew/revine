# Revine smart contracts

The contracts record confirmed invoices, offers, ownership changes, and repayments. The current demo is deployed to Ethereum Sepolia and uses test mIDR.

> **Important:** The public `RevineInvoice` contract uses `AlwaysTrueVerifier`, a placeholder that accepts any proof. Real proof verification is not active on Sepolia. These contracts are for testing and review only; do not use real funds.

## Try the tests

Install Foundry, then from this directory install the pinned libraries and run the contract tests:

```bash
forge install OpenZeppelin/openzeppelin-contracts@v5.7.0 --no-git --shallow
forge install foundry-rs/forge-std@v1.9.7 --no-git --shallow
forge test
```

## Contract flow

- A seller creates an invoice for a buyer.
- The buyer confirms it; the seller receives the invoice token.
- The seller lists the invoice at an offer price.
- A financier pays the seller in test mIDR and receives the token.
- The buyer repays the face amount in test mIDR to whoever holds the token then.

The token can only change hands through the financing function. The contract also includes credit-badge proof plumbing, but the public proof verifier is a placeholder.

## Sepolia addresses

The network is Ethereum Sepolia (`11155111`). The latest documented demo addresses and explorer links are in the root [README](../README.md).

## Deployment

For wallet-signed deployment of the real generated verifiers, use [remix/README.md](remix/README.md). The deployment script in `script/Deploy.s.sol` also broadcasts transactions when used with `--broadcast`; review the script and simulate it before sending any transaction. Keep deployer keys in an untracked local `.env` file and never commit them.
