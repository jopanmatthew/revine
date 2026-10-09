# MetaMask deployment to Sepolia

These sources deploy the generated invoice and credit verifiers and a new
`RevineInvoice` contract using Remix. MetaMask signs each deployment; no wallet
private key is exported or saved.

## Sources

- `InvoiceVerifier.sol` — generated from the invoice Noir circuit.
- `CreditVerifier.sol` — generated from the credit Noir circuit.
- `RevineInvoice.sol` — flattened app contract and OpenZeppelin dependencies.

The existing Sepolia MockIDR token is reused:
`0xf00642cb8069acd00707ccdaa1d0bac5af9828bf`. Do not deploy another token for
this update, or the existing demo wallets' mIDR will not be in the token used
by the new invoice contract.

`InvoiceVerifier.sol` and `CreditVerifier.sol` each define a contract called
`HonkVerifier`. In Remix, select the one nested under the matching source file.
They are different verification keys and cannot be swapped.

## Deploy

1. Open <https://remix.ethereum.org/> and upload all three `.sol` files above.
2. In Solidity Compiler, select `0.8.30`, enable optimization, and set runs to
   `200`. Compile both verifier files and `RevineInvoice.sol`.
3. In Deploy & Run, select **Browser Extension**, connect MetaMask, and verify
   Ethereum Sepolia (`11155111`) is selected.
4. Select `HonkVerifier` under `InvoiceVerifier.sol`. Deploy and confirm in
   MetaMask. Record the address.
5. Select `HonkVerifier` under `CreditVerifier.sol`. Deploy and confirm in
   MetaMask. Record the address.
6. Select `RevineInvoice`. Enter constructor arguments in this order:
   `0xf00642cb8069acd00707ccdaa1d0bac5af9828bf`, the invoice verifier address,
   and the credit verifier address. Deploy and confirm in MetaMask.
7. Record the new `RevineInvoice` address and deployment block from its Sepolia
   Etherscan transaction.
8. Configure the public addresses and block in `apps/web/.env.local` as shown
   in the root `SETUP.md`, then enable `NEXT_PUBLIC_ZK_PROOFS_ENABLED=true`.

Do not enable proof mode against the existing `RevineInvoice`; it points to
`AlwaysTrueVerifier`, which accepts any proof. The generated verifiers only
match the checked-in circuit artifacts. Regenerate both Solidity verifier
files and redeploy if either circuit changes.

## Regenerate sources

From the `contracts/` directory, flatten the app contract after changing its
Solidity source:

```bash
forge flatten src/RevineInvoice.sol -o remix/RevineInvoice.sol
```

Then use the current generated verifier files from `src/verifiers/`. The two
verifier files intentionally remain separate source units because both expose
the contract name `HonkVerifier`.
