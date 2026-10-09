// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVerifier} from "./IVerifier.sol";

/// @notice Temporary testnet verifier for the fingerprint-only release before P1/P2.
/// @dev Replace both instances with generated verifiers before describing proofs as verified.
contract AlwaysTrueVerifier is IVerifier {
    function verify(bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return true;
    }
}
