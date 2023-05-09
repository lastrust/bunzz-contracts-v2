import { ethers } from "hardhat";
import { expect } from "chai";
import {SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AuctionERC1155, MockERC1155, AuctionERC1155__factory, MockERC1155__factory } from "../typechain-types";

const emptyStringHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(""));
describe("AuctionERC1155", function () {
    let token: MockERC1155;
    let auction: AuctionERC1155;
    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer1: SignerWithAddress;
    let buyer2: SignerWithAddress;

    beforeEach(async function () {
        [owner, seller, buyer1, buyer2] = await ethers.getSigners();

        const erc1155_factory = new MockERC1155__factory(owner);
        token = await erc1155_factory.deploy("https://example.com/token/");

        const auction_factory = new AuctionERC1155__factory(owner);
        auction = await auction_factory.deploy(token.address);
    });

    it("should create an auction", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const nftAmount = 10;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);

        await token.connect(seller).setApprovalForAll(auction.address, true);
        await expect(
            auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime)
        ).to.emit(auction, "CreatedAuction").withArgs(seller.address, tokenId, 1, startPrice, desiredPrice, nftAmount, startTime, endTime);

        const auctionData = await auction.auctions(1);
        expect(auctionData.tokenId).to.equal(tokenId);
        expect(auctionData.startPrice).to.equal(startPrice);
        expect(auctionData.desiredPrice).to.equal(desiredPrice);
        expect(auctionData.seller).to.equal(seller.address);
        expect(auctionData.startTime).to.equal(startTime);
        expect(auctionData.endTime).to.equal(endTime);
        expect(auctionData.nftAmount).to.equal(nftAmount);

        const ownerOfToken = await token.balanceOf(auction.address, tokenId);
        expect(ownerOfToken).to.equal(nftAmount);
    });

    it("should add a bid", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const nftAmount = 1;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);
        await expect(auction.connect(buyer1).addBid(1, {value: startPrice})).to.emit(auction, "AddBid").withArgs(1, buyer1.address, startPrice);

        const bidData = await auction.bids(1);
        expect(bidData.buyer).to.equal(buyer1.address);
        expect(bidData.amount).to.equal(startPrice);
    });


    it("should return the tokens to the seller if no bids are made and auction is closed", async function () {
        const tokenId = 1;
        const nftAmount = 10;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [1000]); // fast forward time

        await auction.connect(seller).claim(1);

        const balanceOfSeller = await token.balanceOf(seller.address, tokenId);
        expect(balanceOfSeller).to.equal(nftAmount);

        const balanceOfAuction = await token.balanceOf(auction.address, tokenId);
        expect(balanceOfAuction).to.equal(0);
    });

    it("should not allow non-owner to create an auction", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, 1, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await expect(
            auction.connect(buyer1).createAuction(tokenId, startPrice, desiredPrice, 1, startTime, endTime)
        ).to.be.revertedWith("token balance is not enough");
    });

    it("should not add a bid if auction is closed", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const nftAmount = 10;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [3600]);

        await expect(auction.connect(buyer1).addBid(1, {value: startPrice})).to.be.revertedWith("auction is already closed");
    });

    it("should not add a bid if bid amount is lower than current highest bid", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const nftAmount = 10;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);

        await auction.connect(buyer1).addBid(1, {value: startPrice});

        await expect(auction.connect(buyer2).addBid(1, {value: startPrice})).to.be.revertedWith("bit amount <= last bid amount");
    });

    it("should update the highest bid if a new bid is higher", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 2;
        const nftAmount = 10;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);

        await auction.connect(buyer1).addBid(1, {value: startPrice});

        await expect(auction.connect(buyer2).addBid(1, {value: startPrice + 1})).to.emit(auction, "AddBid").withArgs(1, buyer2.address, startPrice + 1);

        const bidData = await auction.bids(1);
        expect(bidData.buyer).to.equal(buyer2.address);
        expect(bidData.amount).to.equal(startPrice + 1);
    });

    it("should claim the token if buyout price is reached before the end of the auction", async function () {
        const tokenId = 1;
        const startPrice = 1;
        const desiredPrice = 5;
        const nftAmount = 3;
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = startTime + 60;

        await token.connect(owner).mint(seller.address, tokenId, nftAmount, emptyStringHex);
        await token.connect(seller).setApprovalForAll(auction.address, true);
        await auction.connect(seller).createAuction(tokenId, startPrice, desiredPrice, nftAmount, startTime, endTime);

        await ethers.provider.send("evm_increaseTime", [10]);

        await expect(auction.connect(buyer1).addBid(1, {value: desiredPrice})).to.emit(auction, "AddBid").withArgs(1, buyer1.address, desiredPrice);

        await ethers.provider.send("evm_increaseTime", [1000]); // fast forward time

        await auction.connect(seller).claim(1);

        const _nftAmount = await token.balanceOf(buyer1.address, 1);
        expect(_nftAmount.toNumber()).to.equal(nftAmount);
    });

});