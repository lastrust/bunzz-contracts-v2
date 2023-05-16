// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IMarketplaceNativeERC721.sol";

contract MarketplaceNativeERC721 is Ownable, IMarketplaceNativeERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private lastListingId;

    IERC721 public token;

    struct Listing {
        uint256 tokenId;
        uint256 price;
        address currency;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public tokensListing;

    modifier onlyItemOwner(uint256 tokenId) {
        isItemOwner(tokenId);
        _;
    }

    modifier onlyTransferApproval(uint256 tokenId) {
        isTransferApproval(tokenId);
        _;
    }

    constructor(address _token) {
        token = IERC721(_token);
    }

    function isItemOwner(uint256 tokenId) internal {
        require(token.ownerOf(tokenId) == _msgSender(), "Marketplace: Not the item owner");
    }

    function isTransferApproval(uint256 tokenId) internal {
        require(token.getApproved(tokenId) == address(this), "Marketplace: Marketplace is not approved to use this tokenId");
    }

    function list(
        uint256 tokenId,
        uint256 price
    ) external override onlyItemOwner(tokenId) onlyTransferApproval(tokenId) {
        lastListingId.increment();
        uint256 listingId = lastListingId.current();

        require(
            tokensListing[tokenId] == 0,
            "Marketplace: the token is already listed"
        );

        require(price > 0, "Marketplace: the price is zero");

        tokensListing[tokenId] = listingId;

        Listing memory newListing = Listing(
            tokenId,
            price,
            address(0)
        );

        listings[listingId] = newListing;

        emit NewListing(
            listingId,
            tokenId,
            msg.sender,
            price,
            address(0),
            block.timestamp
        );
    }

    function buy(uint256 tokenId) external payable override {
        require(tokensListing[tokenId] > 0, "Marketplace: list does not exist");
        Listing memory _list = listings[tokensListing[tokenId]];
        require(_list.price > 0, "Marketplace: list does not exist");
        address tokenOwner = token.ownerOf(tokenId);
        require(
            _list.price == msg.value,
            "Marketplace: The sent value doesn't equal the price"
        );
        require(
            _list.currency == address(0),
            "Marketplace: item currency is not the native one"
        );
        require(
            tokenOwner != msg.sender,
            "Marketplace: seller has the same address as buyer"
        );

        emit Sold(
            tokenId,
            tokenOwner,
            msg.sender,
            msg.value,
            address(0),
            block.timestamp
        );
        clearStorage(tokenId);
        token.safeTransferFrom(tokenOwner, msg.sender, tokenId, "");
        payable(tokenOwner).transfer(msg.value);
    }

    function changePrice(
        uint256 tokenId,
        uint256 newPrice
    ) external onlyItemOwner(tokenId) {
        require(tokensListing[tokenId] > 0, "Marketplace: list does not exist");
        Listing storage _list = listings[tokensListing[tokenId]];
        require(_list.price > 0, "Marketplace: list does not exist");
        require(newPrice > 0, "Marketplace: the new price is zero");
        require(
            _list.price != newPrice,
            "Marketplace: newPrice is the same as old price"
        );
        emit PriceChanged(
            address(token),
            msg.sender,
            tokenId,
            _list.price,
            newPrice
        );
        _list.price = newPrice;
    }

    function cancelListing(uint256 tokenId) external onlyItemOwner(tokenId) {
        clearStorage(tokenId);
        emit ListingCanceled(address(token), tokenId);
    }

    function clearStorage(uint256 tokenId) internal {
        delete listings[tokensListing[tokenId]];
        delete tokensListing[tokenId];
    }
}
