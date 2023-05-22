pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IMarketplaceNativeERC1155.sol";

contract MarketplaceNativeERC1155 is Ownable, IMarketplaceNativeERC1155 {
    using Counters for Counters.Counter;
    Counters.Counter private lastListingId;

    IERC1155 public token;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price; // the price per token.
        uint256 amount;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public tokensListing;

    modifier onlyItemOwner(uint256 tokenId) {
        require(
            token.balanceOf(_msgSender(), tokenId) > 0,
            "Marketplace: Not the item owner"
        );
        _;
    }

    modifier enoughTokenBalance(uint256 tokenId, uint256 amount) {
        require(
            token.balanceOf(_msgSender(), tokenId) >= amount,
            "Marketplace: Token balance is not enough"
        );
        _;
    }

    modifier onlyTransferApproval(uint256 tokenId) {
        require(
            token.isApprovedForAll(_msgSender(), address(this)) == true,
            "Marketplace: Marketplace is not approved to use this tokenId"
        );
        _;
    }

    constructor(address _token) {
        token = IERC1155(_token);
    }

    function list(uint256 tokenId, uint256 amount, uint256 price)
        external
        override
        enoughTokenBalance(tokenId, amount)
        onlyTransferApproval(tokenId)
    {
        require(price > 0, "Marketplace: the price is zero");

        uint256 listingId = tokensListing[tokenId];

        if (listingId == 0) {
            lastListingId.increment();
            listingId = lastListingId.current();
            tokensListing[tokenId] = listingId;
        }

        Listing storage _list = listings[listingId];
        _list.amount = amount;
        _list.price = price;
        _list.tokenId = tokenId;
        _list.seller = msg.sender;

        if (listingId > 0) {
            emit UpdateListing(
                listingId,
                tokenId,
                msg.sender,
                amount,
                price,
                block.timestamp
            );
        } else {
            emit NewListing(
                listingId,
                tokenId,
                msg.sender,
                amount,
                price,
                block.timestamp
            );

        }
    }

    function buy(uint256 listingId, uint256 amount) external payable override {
        Listing storage _list = listings[listingId];
        require(_list.seller != address(0x0), "Marketplace: listingId is invalid" );
        require(
            _list.price * amount == msg.value,
            "Marketplace: not enough tokens send"
        );
        require(
            _list.seller != msg.sender,
            "Marketplace: seller has the same address as buyer"
        );
        require(
            _list.amount >= amount,
            "Marketplace: token amount is not enough in the marketplace"
        );
        token.safeTransferFrom(_list.seller, msg.sender, _list.tokenId, amount, "");
        payable(_list.seller).transfer(msg.value);

        emit Sold(
            _list.tokenId,
            _list.seller,
            msg.sender,
            amount,
            msg.value,
            block.timestamp
        );
        if (_list.amount == amount) {
            _removeList(_list.tokenId);
        } else {
            _list.amount = _list.amount - amount;
        }
    }

    function cancelList(uint256 tokenId) external onlyItemOwner(tokenId) {
        require(tokensListing[tokenId] > 0, "Marketplace: tokenId is invalid");
        Listing storage _list = listings[tokensListing[tokenId]];
        require(_list.amount > 0, "Marketplace: tokenId is invalid");
        _removeList(tokenId);
        CancelListing(tokenId, _list.seller, block.timestamp);
    }

    function _removeList(uint256 tokenId) internal {
        delete listings[tokensListing[tokenId]];
        delete tokensListing[tokenId];
    }
}
