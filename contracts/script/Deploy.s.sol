// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockIDR} from "../src/MockIDR.sol";
import {RevineInvoice} from "../src/RevineInvoice.sol";
import {HonkVerifier as InvoiceVerifier} from "../src/verifiers/InvoiceVerifier.sol";
import {HonkVerifier as CreditVerifier} from "../src/verifiers/CreditVerifier.sol";
import {IVerifier} from "../src/verifiers/IVerifier.sol";

/// @notice Deploy the P1/P2 proof verifiers and RevineInvoice to Sepolia.
contract Deploy is Script {
    function run()
        external
        returns (
            MockIDR midr,
            InvoiceVerifier invoiceVerifier,
            CreditVerifier creditVerifier,
            RevineInvoice revine
        )
    {
        require(block.chainid == 11155111, "revine deploys only to Sepolia");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        address existingMockIdr = vm.envOr("MOCK_IDR_ADDRESS", address(0));
        midr = existingMockIdr == address(0) ? new MockIDR() : MockIDR(existingMockIdr);
        invoiceVerifier = new InvoiceVerifier();
        creditVerifier = new CreditVerifier();
        revine = new RevineInvoice(
            midr, IVerifier(address(invoiceVerifier)), IVerifier(address(creditVerifier))
        );
        vm.stopBroadcast();

        console2.log("MockIDR:", address(midr));
        console2.log("Invoice verifier:", address(invoiceVerifier));
        console2.log("Credit verifier:", address(creditVerifier));
        console2.log("RevineInvoice:", address(revine));

        _faucetForOptionalDemoWallet(
            vm.envOr("DEMO_SELLER_PRIVATE_KEY", uint256(0)), midr, "seller"
        );
        _faucetForOptionalDemoWallet(vm.envOr("DEMO_BUYER_PRIVATE_KEY", uint256(0)), midr, "buyer");
        _faucetForOptionalDemoWallet(
            vm.envOr("DEMO_FINANCIER_PRIVATE_KEY", uint256(0)), midr, "financier"
        );
    }

    function _faucetForOptionalDemoWallet(uint256 walletKey, MockIDR midr, string memory role)
        private
    {
        if (walletKey == 0) {
            console2.log(
                string.concat("No ", role, " key supplied; that wallet can call faucet() itself.")
            );
            return;
        }

        address wallet = vm.addr(walletKey);
        vm.startBroadcast(walletKey);
        midr.faucet();
        vm.stopBroadcast();
        console2.log(string.concat("Funded ", role, " wallet:"), wallet);
    }
}
