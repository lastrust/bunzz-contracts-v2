// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IAirdropERC20 {
    function airdrop(address[] calldata recipients, uint256[] calldata amounts)
    external;

    function retrieveTokens(uint256 amount) external;
}