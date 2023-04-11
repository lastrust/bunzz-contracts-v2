pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./interfaces/IAuctionERC1155.sol";


contract AuctionERC721 is Ownable, IAuctionERC1155, ERC1155Holder{

    struct Auction{
        uint256 tokenId;
        uint256 minPrice;
        uint256 buyoutPrice;
        uint256 nftAmount;
        address seller;
        uint96 startTime;
        uint96 endTime;
        bool isClaimed;
    }

    struct Bid{
        address buyer;
        uint256 amount;
    }

    event CreatedAuction(address indexed seller, uint256 indexed tokenId, uint256 indexed auctionId, uint256 minPrice, uint256 buyoutPrice, uint256 nftAmount, uint96 startTime, uint96 endTime);
    event AddBid(uint256 indexed auctionId, address indexed buyer, uint256 amount);
    event Sold(uint256 indexed auctionId, address indexed seller, address indexed winner, uint256 tokenId, uint256 nftAmount, uint256 amount);
    event NotSold(uint256 indexed auctionId, address indexed seller, uint256 indexed tokenId, uint256 nftAmount);

    uint256 public auctionId;

    IERC1155 public token;

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid) public bids;

    constructor(address _token) {
        require(_token != address(0x0), "address invalid");
        token = IERC1155(_token);
    }

    function createAuction(
        uint256 tokenId,
        uint256 minPrice,
        uint256 buyoutPrice,
        uint256 nftAmount,
        uint96 startTime,
        uint96 endTime) external override
    {
        require(nftAmount <= token.balanceOf(msg.sender, tokenId), "token balance is not enough");
        require(buyoutPrice > minPrice, "price is invalid");
        require(minPrice > 0, "min price is invalid");
        require(startTime > currentTime(), "start time is invalid");
        require(endTime > startTime, "end time is invalid");

        Auction memory auction = Auction(
            tokenId,
            minPrice,
            buyoutPrice,
            nftAmount,
            msg.sender,
            startTime,
            endTime,
            false
        );

        unchecked {
            auctionId += 1;
        }

        token.safeTransferFrom(msg.sender, address(this), tokenId, nftAmount, "");

        auctions[auctionId] = auction;

        emit CreatedAuction(msg.sender, tokenId, auctionId, minPrice, buyoutPrice, nftAmount, startTime, endTime);
    }

    function addBid(uint256 _auctionId) external override payable  {
        Auction memory auction = auctions[_auctionId];
        require(auction.seller != address(0x0), "auction is not exist");

        require(auction.startTime <= currentTime(), "auction is not opened");
        require(auction.endTime > currentTime(), "auction is already closed");

        Bid storage bid = bids[_auctionId];

        // To save gas cost
        if (bid.buyer != msg.sender) {
            require(msg.value >= auction.minPrice, "bid amount < min price");
            require(msg.value > bid.amount, "bit amount <= last bid amount");
            address lastBuyer = bid.buyer;
            uint256 lastBidAmount = bid.amount;
            bid.buyer = msg.sender;
            bid.amount = msg.value;

            emit AddBid(_auctionId, msg.sender, msg.value);
            // Send ETH at end of function to protect contract from reentrancy attack
            payable(lastBuyer).transfer(lastBidAmount);
        } else {
            require(msg.value > 0, "bid amount is 0");
            bid.amount = bid.amount + msg.value;
            emit AddBid(_auctionId, msg.sender, bid.amount);
        }
    }

    // seller or winner will call this function
    function claim(uint256 _auctionId) external override {
        Bid memory bid = bids[_auctionId];
        Auction memory auction = auctions[_auctionId];

        require(msg.sender == bid.buyer || msg.sender == auction.seller, "caller is neither of seller and winner");
        require(auction.endTime < currentTime(), "auction is not closed yet");

        if (auction.buyoutPrice <= bid.amount) { // token is sold
            token.safeTransferFrom(address(this), bid.buyer, auction.tokenId, auction.nftAmount, "");
            emit Sold(_auctionId, auction.seller, bid.buyer, auction.tokenId, auction.nftAmount, bid.amount);

            auctions[_auctionId].isClaimed = true;

            payable(auction.seller).transfer(bid.amount);
        } else { // token is not sold
            token.safeTransferFrom(address(this), auction.seller, auction.tokenId, auction.nftAmount, "");
            emit NotSold(_auctionId, auction.seller, auction.tokenId, auction.nftAmount);

            auctions[_auctionId].isClaimed = true;

            payable(bid.buyer).transfer(bid.amount);
        }
    }

    function currentTime() internal view returns(uint96) {
        return uint96(block.timestamp);
    }
}