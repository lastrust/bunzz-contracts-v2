// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MockERC1155 is ERC1155 {
    using SafeMath for uint256;

    constructor(string memory uri_) ERC1155(uri_) {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external {
        _mint(to, id, amount, data);
    }
}