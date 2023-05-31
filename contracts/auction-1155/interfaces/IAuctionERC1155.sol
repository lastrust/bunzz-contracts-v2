pragma solidity ^0.8.0;

interface IAuctionERC1155 {
    function createAuction(
        uint256 tokenId,
        uint256 minPrice,
        uint256 buyoutPrice,
        uint256 nftAmount,
        uint96 startTime,
        uint96 endTime
    ) external;

    function addBid(uint256 auctionId) external payable;

    function claim(uint256 auctionId) external;
}