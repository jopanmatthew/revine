// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only rupiah token. One token unit represents one simulated rupiah.
contract MockIDR is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 100_000_000;

    constructor() ERC20("Mock Rupiah", "mIDR") {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
