// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAirdropERC20.sol";
import "../bunzz/IBunzz.sol";

contract AirdropERC20 is Ownable, IBunzz, IAirdropERC20 {
    address public token;
    uint256 public maxRecipientCount = 400;

    function connectToOtherContracts(address[] calldata contracts)
    external
    override
    onlyOwner
    {
        require(contracts.length > 0, "contracts invalid");
        require(contracts[0] != address(0x0), "zero address");
        require(token != contracts[0], "same token address");
        if (token != address (0x0)) require(IERC20(token).balanceOf(address(this)) == 0, "old token balance is not 0");
        token = contracts[0];
    }

    function setMaxRecipientCount(uint256 _maxRecipientCount) external onlyOwner {
        maxRecipientCount = _maxRecipientCount;
    }

    function airdrop(address[] calldata recipients, uint256[] calldata amounts)
    external override
    onlyOwner
    {
        require(token != address(0), "Token have not been set");
        require(
            recipients.length == amounts.length,
            "Arrays must have the same length"
        );
        require(recipients.length < maxRecipientCount, "too many recipients");

        unchecked {
            for (uint256 i = 0; i < recipients.length; ++i) {
                IERC20(token).transfer(recipients[i], amounts[i]);
            }
        }
    }

    function retrieveTokens(uint256 amount) external override onlyOwner {
        require(token != address(0), "Token have not been set");

        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Amount you wish to retrieve is bigger then actual balance"
        );

        IERC20(token).transfer(msg.sender, amount);
    }
}