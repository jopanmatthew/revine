# Optional: deploy real proof verifiers with Remix

This guide is for a future Sepolia deployment that enables invoice and credit proof checks. The current public invoice contract uses `AlwaysTrueVerifier`, which accepts any proof. Do not enable proof mode on that deployment.

MetaMask signs each deployment; this process does not require exporting a wallet private key. It does require Sepolia ETH for gas and creates new public contracts.

## Before you begin

- Confirm that `InvoiceVerifier.sol`, `CreditVerifier.sol`, and `RevineInvoice.sol` match the current circuits and contract source.
- Keep the existing Sepolia MockIDR address so the demo wallets' test balances remain usable: `0xf00642cb8069acd00707ccdaa1d0bac5af9828bf`.
- The two generated verifier files both define `HonkVerifier`. In Remix, choose the one nested under the correct source file; the invoice and credit verifiers cannot be swapped.

## Deploy from Remix

1. Open [Remix](https://remix.ethereum.org/) and upload the three Solidity files in this folder.
2. In **Solidity Compiler**, select `0.8.30`, turn on optimization, and use 200 runs. Compile both verifier files and `RevineInvoice.sol`.
3. In **Deploy & Run**, select **Browser Extension**, connect MetaMask, and check that Ethereum Sepolia (`11155111`) is selected.
4. Select `HonkVerifier` under `InvoiceVerifier.sol`, deploy it, and record its address.
5. Select `HonkVerifier` under `CreditVerifier.sol`, deploy it, and record its address.
6. Select `RevineInvoice`. Enter constructor values in this order: the MockIDR address above, the invoice verifier address, and the credit verifier address. Deploy and record the new invoice contract address and deployment block from its Sepolia Etherscan transaction.
7. Configure the new public addresses and deployment block in your local `apps/web/.env.local`. Keep `NEXT_PUBLIC_USE_MOCKS=false` and only enable `NEXT_PUBLIC_ZK_PROOFS_ENABLED=true` after the new contract has been deployed and checked.

The deployed verifiers only match their exact circuit artifacts. Regenerate and review the verifier sources if either circuit changes. The current addresses and status are in the root [README](../../README.md).

## Refresh the flattened invoice source

After changing the Solidity contract, run this from the `contracts/` directory:

```bash
forge flatten src/RevineInvoice.sol -o remix/RevineInvoice.sol
```

Keep the generated invoice and credit verifier files as separate source units because both contain a `HonkVerifier` contract.
