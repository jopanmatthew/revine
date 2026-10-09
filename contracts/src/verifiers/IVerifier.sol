// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Interface implemented by the Noir-generated Solidity verifiers.
interface IVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs)
        external
        view
        returns (bool);
}
