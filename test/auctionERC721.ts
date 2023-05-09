import { ethers } from "hardhat";
import { expect } from "chai";
import {SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AuctionERC721, MockERC721, AuctionERC721__factory, MockERC721__factory } from "../typechain-types";

describe("AuctionERC721", function () {
    let token: MockERC721;
    let auction: AuctionERC721;
    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer1: SignerWithAddress;
    let buyer2: SignerWithAddress;

    beforeEach(async function () {
        [owner, seller, buyer1, buyer2] = await ethers.getSigners();

        const erc721_factory= new MockERC721__factory(owner);
        token = await erc721_factory.deploy("MyToken", "MT");

        const auction_factory = new AuctionERC721__factory(owner);
        auction = await auction_factory.deploy(token.address);
    });

    it("should create an auction", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);
        await token.connect(seller).approve(auction.address, tokenId);
        await expect(
            auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, startTime, endTime)
        ).to.emit(auction, "CreatedAuction").withArgs(seller.address, tokenId, 1, startPrice, desiredPrice, startTime, endTime);

        const auctionData = await auction.auctions(1);
        expect(auctionData.tokenId).to.equal(tokenId);
        expect(auctionData.startPrice).to.equal(startPrice);
        expect(auctionData.desiredPrice).to.equal(desiredPrice);
        expect(auctionData.seller).to.equal(seller.address);
        expect(auctionData.startTime).to.equal(startTime);
        expect(auctionData.endTime).to.equal(endTime);

        const ownerOfToken = await token.ownerOf(tokenId);
        expect(ownerOfToken).to.equal(auction.address);
    });

    it("should add a bid", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);
        await token.connect(seller).approve(auction.address, tokenId);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);
        await expect(auction.connect(buyer1).addBid(1, { value: startPrice })).to.emit(auction, "AddBid").withArgs(1, buyer1.address, startPrice);

        const bidData = await auction.bids(1);
        expect(bidData.buyer).to.equal(buyer1.address);
        expect(bidData.amount).to.equal(startPrice);
    });

    it("should not add a bid if auction is closed", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);
        await token.connect(seller).approve(auction.address, tokenId);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [3600]);

        await expect(auction.connect(buyer1).addBid(1, { value: startPrice })).to.be.revertedWith("auction is already closed");
    });

    it("should not add a bid if bid amount is lower than current highest bid", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);
        await token.connect(seller).approve(auction.address, tokenId);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);

        await auction.connect(buyer1).addBid(1, { value: startPrice });

        await expect(auction.connect(buyer2).addBid(1, { value: startPrice })).to.be.revertedWith("bit amount <= last bid amount");
    });

    it("should update the highest bid if a new bid is higher", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);
        await token.connect(seller).approve(auction.address, tokenId);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);

        await auction.connect(buyer1).addBid(1, { value: startPrice });

        await expect(auction.connect(buyer2).addBid(1, { value: startPrice + 1 })).to.emit(auction, "AddBid").withArgs(1, buyer2.address, startPrice + 1);

        const bidData = await auction.bids(1);
        expect(bidData.buyer).to.equal(buyer2.address);
        expect(bidData.amount).to.equal(startPrice + 1);
    });


    it("should return the token if buyout price is not reached and auction is closed", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId);
        await token.connect(seller).approve(auction.address, tokenId);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);

        await auction.connect(buyer1).addBid(1, { value: startPrice });

        await ethers.provider.send("evm_increaseTime", [1000]); // fast forward time

        await auction.connect(seller).claim(1);

        const ownerOfToken = await token.ownerOf(tokenId);
        expect(ownerOfToken).to.equal(seller.address);
    });

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


