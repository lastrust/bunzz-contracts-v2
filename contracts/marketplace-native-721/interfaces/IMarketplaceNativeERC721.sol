// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMarketplaceNativeERC721 {
    event NewListing(
        uint256 indexed listId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        address currency,
        uint256 timestamp
    );
    event Sold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        address currency,
        uint256 timestamp
    );
    event PriceChanged(
        address indexed nft,
        address indexed setter,
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );
    event ListingCanceled(address indexed nft, uint256 indexed tokenId);
    event NftSet(address indexed nft, address setter);

    function list(uint256 tokenId, uint256 price) external;

    function buy(uint256 tokenId) external payable;
}
