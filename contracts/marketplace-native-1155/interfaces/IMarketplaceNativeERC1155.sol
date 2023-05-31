pragma solidity ^0.8.0;

interface IMarketplaceNativeERC1155 {
    event NewListing(uint256 indexed listId, uint256 indexed tokenId, address indexed seller, uint256 tokenAmount, uint256 price, uint256 timestamp);
    event UpdateListing(uint256 indexed listId, uint256 indexed tokenId, address indexed seller, uint256 tokenAmount, uint256 price, uint256 timestamp);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 amount, uint256 totalPrice, uint256 timestamp);
    event CancelListing(uint256 tokenId, address indexed seller, uint256 timestamp);

    function list(uint256 tokenId, uint256 amount, uint256 price) external;
    function buy(uint256 tokenId, uint256 amount) external payable;
}