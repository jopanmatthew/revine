// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// src/verifiers/IVerifier.sol

/// @notice Interface implemented by the Noir-generated Solidity verifiers.
interface IVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs)
        external
        view
        returns (bool);
}

// src/verifiers/AlwaysTrueVerifier.sol

/// @notice Temporary testnet verifier for the fingerprint-only release before P1/P2.
/// @dev Replace both instances with generated verifiers before describing proofs as verified.
contract AlwaysTrueVerifier is IVerifier {
    function verify(bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return true;
    }
}
