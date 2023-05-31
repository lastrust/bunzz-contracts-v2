// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RoyaltyNFT is ERC721, ERC721URIStorage {
    struct Royalty {
        address payable recipient;
        uint256 rate; // Stored as a percentage with two decimal places, so 10000 means 100.00%
    }

    mapping(uint256 => Royalty) public royalties;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mintWithRoyalty(
        address to,
        uint256 tokenId,
        string memory tokenURI,
        address payable royaltyRecipient,
        uint256 royaltyRate
    ) public {
        // Mint the token
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Set the royalty
        royalties[tokenId] = Royalty(royaltyRecipient, royaltyRate);
    }

    function getRoyalty(uint256 tokenId) public view returns (address payable, uint256) {
        Royalty memory royalty = royalties[tokenId];
        return (royalty.recipient, royalty.rate);
    }

    // Ensure to override the necessary functions when you're using ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}