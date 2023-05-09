import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { AuctionERC721, ERC721, AuctionERC721__factory, ERC721__factory } from "../typechain-types";

describe("AuctionERC721", function () {
    let token: ERC721;
    let auction: AuctionERC721;
    let owner: Signer;
    let seller: Signer;
    let buyer1: Signer;
    let buyer2: Signer;

    beforeEach(async function () {
        [owner, seller, buyer1, buyer2] = await ethers.getSigners();

        const erc721_factory= new ERC721__factory(owner);
        token = await erc721_factory.deploy("MyToken", "MT");

        const auction_factory = new AuctionERC721__factory(owner);
        auction = await auction_factory.deploy(token.address);
    });

    it("should create an auction", async function () {
        const tokenId = 1;
        const minPrice = 1;
        const buyoutPrice = 2;
        const startTime = Math.floor(Date.now() / 1000) + 1; // start in 1 second
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);

        await expect(
            auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime)
        ).to.emit(auction, "CreatedAuction").withArgs(seller.address, tokenId, 1, minPrice, buyoutPrice, startTime, endTime);

        const auctionData = await auction.auctions(1);
        expect(auctionData.tokenId).to.equal(tokenId);
        expect(auctionData.minPrice).to.equal(minPrice);
        expect(auctionData.buyoutPrice).to.equal(buyoutPrice);
        expect(auctionData.seller).to.equal(seller.address);
        expect(auctionData.startTime).to.equal(startTime);
        expect(auctionData.endTime).to.equal(endTime);

        const ownerOfToken = await token.ownerOf(tokenId);
        expect(ownerOfToken).to.equal(auction.address);
    });

    // it("should add a bid", async function () {
    //     const tokenId = 1;
    //     const minPrice = 1;
    //     const buyoutPrice = 2;
    //     const startTime = Math.floor(Date.now() / 1000) + 1; // start in 1 second
    //     const endTime = startTime + 60;
    //
    //     await token.connect(seller).mint(seller.address, tokenId);
    //     await auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime);
    //
    //     await expect(auction.connect(buyer1).addBid(1, { value: minPrice })).to.emit(auction, "AddBid").withArgs(1, buyer1.address, minPrice);
    //
    //     const bidData = await auction.bids(1);
    //     expect(bidData.buyer).to.equal(buyer1.address);
    //     expect(bidData.amount).to.equal(minPrice);
    // });
    //
    // it("should not add a bid if auction is closed", async function () {
    //     const tokenId = 1;
    //     const minPrice = 1;
    //     const buyoutPrice = 2;
    //     const startTime = Math.floor(Date.now() / 1000) - 60; // start 60 seconds ago
    //     const endTime = startTime + 10;
    //
    //     await token.connect(seller).mint(seller.address, tokenId);
    //     await auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime);
    //
    //     await expect(auction.connect(buyer1).addBid(1, { value: minPrice })).to.be.revertedWith("auction is already closed");
    // });
    //
    // it("should not add a bid if bid amount is lower than current highest bid", async function () {
    //     const tokenId = 1;
    //     const minPrice = 1;
    //     const buyoutPrice = 2;
    //     const startTime = Math.floor(Date.now() / 1000) + 1; // start in 1 second
    //     const endTime = startTime + 60;
    //
    //     await token.connect(seller).mint(seller.address, tokenId);
    //     await auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime);
    //
    //     await auction.connect(buyer1).addBid(1, { value: minPrice });
    //
    //     await expect(auction.connect(buyer2).addBid(1, { value: minPrice })).to.be.revertedWith("bit amount <= last bid amount");
    // });
    //
    // it("should update the highest bid if a new bid is higher", async function () {
    //     const tokenId = 1;
    //     const minPrice = 1;
    //     const buyoutPrice = 2;
    //     const startTime = Math.floor(Date.now() / 1000) + 1; // start in 1 second
    //     const endTime = startTime + 60;
    //
    //     await token.connect(seller).mint(seller.address, tokenId);
    //     await auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime);
    //
    //     await auction.connect(buyer1).addBid(1, { value: minPrice });
    //
    //     await expect(auction.connect(buyer2).addBid(1, { value: minPrice + 1 })).to.emit(auction, "AddBid").withArgs(1, buyer2.address, minPrice + 1);
    //
    //     const bidData = await auction.bids(1);
    //     expect(bidData.buyer).to.equal(buyer2.address);
    //     expect(bidData.amount).to.equal(minPrice + 1);
    // });
    //
    // it("should sell the token if buyout price is reached", async function () {
    //     const tokenId = 1;
    //     const minPrice = 1;
    //     const buyoutPrice = 2;
    //     const startTime = Math.floor(Date.now() / 1000) + 1; // start in 1 second
    //     const endTime = startTime + 60;
    //
    //     await token.connect(seller).mint(seller.address, tokenId);
    //     await auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime);
    //
    //     await auction.connect(buyer1).addBid(1, { value: buyoutPrice });
    //
    //     const ownerOfToken = await token.ownerOf(tokenId);
    //     expect(ownerOfToken).to.equal(buyer1.address);
    //
    //     const bidData = await auction.bids(1);
    //     expect(bidData.amount).to.equal(buyoutPrice);
    // });
    //
    // it("should return the token if buyout price is not reached and auction is closed", async function () {
    //     const tokenId = 1;
    //     const minPrice = 1;
    //     const buyoutPrice = 2;
    //     const startTime = Math.floor(Date.now() / 1000) - 60; // start 60 seconds ago
    //     const endTime = startTime + 10;
    //
    //     await token.connect(seller).mint(seller.address, tokenId);
    //     await auction.connect(seller).createAuction(tokenId, minPrice, buyoutPrice, startTime, endTime);
    //
    //     await auction.connect(buyer1).addBid(1, { value: minPrice });
    //
    //     await ethers.provider.send("evm_increaseTime", [11]); // fast forward time
    //
    //     await auction.connect(seller).claim(1);
    //
    //     const ownerOfToken = await token.ownerOf(tokenId);
    //     expect(ownerOfToken).to.equal(seller.address);
    // });
    //
    // afterEach(async function () {
    //     const auctionId = await auction.auctionId();
    //     for (let i = 1; i <= auctionId; i++) {
    //         const auctionData = await auction.auctions(i);
    //         const tokenId = auctionData.tokenId;
    //         if (tokenId != 0) {
    //             await auction.connect(seller).claim(i);
    //         }
    //     }
    // });
});


