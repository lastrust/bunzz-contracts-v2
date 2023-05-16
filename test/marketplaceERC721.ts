import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MarketplaceNativeERC721, MockERC721, MarketplaceNativeERC721__factory, MockERC721__factory } from "../typechain-types";

describe("MarketplaceNativeERC721", () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let token: MockERC721;
    let marketplace: MarketplaceNativeERC721;

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();

        const tokenFactory = new MockERC721__factory(deployer)
        token = await tokenFactory.deploy('My Token', 'MTK');
        await token.deployed();

        const marketplaceFactory = new MarketplaceNativeERC721__factory(deployer);
        marketplace = await marketplaceFactory.deploy(token.address);
        await marketplace.deployed();
    });

    describe("list()", () => {
        it("should list an item for sale", async () => {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1");

            await token.mint(user.address, tokenId);
            await token.connect(user).approve(marketplace.address, tokenId);

            const listing = await marketplace.listings(1);
            expect(listing.tokenId).to.equal(tokenId);
            expect(listing.price).to.equal(price);
            expect(listing.currency).to.equal(ethers.constants.AddressZero);
            expect(listing.isSold).to.equal(false);
            expect(listing.exist).to.equal(true);
        });
    });

    describe("buy()", () => {
        it("should allow buying an item with native currency", async () => {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1");

            await token.mint(user.address, tokenId);
            await token.connect(user).approve(marketplace.address, tokenId);
            await marketplace.connect(user).list(tokenId, price);

            const balanceBefore = await ethers.provider.getBalance(user.address);

            await expect(marketplace.connect(deployer).buy(tokenId, {value: price}))
                .to.emit(marketplace, "Sold")
                .withArgs(tokenId, user.address, deployer.address, price, ethers.constants.AddressZero);

            const listing = await marketplace.listings(1);
            expect(listing.isSold).to.equal(true);

            const balanceAfter = await ethers.provider.getBalance(user.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(price);
        });
    });

    describe("changePrice()", () => {
        it("should allow the item owner to change the price", async () => {
            const tokenId = 1;
            const initialPrice = ethers.utils.parseEther("1");
            const newPrice = ethers.utils.parseEther("2");

            await token.mint(user.address, tokenId);
            await token.connect(user).approve(marketplace.address, tokenId);
            await marketplace.connect(user).list(tokenId, initialPrice);

            await expect(marketplace.connect(user).changePrice(tokenId, newPrice))
                .to.emit(marketplace, "PriceChanged")
                .withArgs(token.address, user.address, tokenId, initialPrice, newPrice);

            const listing = await marketplace.listings(1);
            expect(listing.price).to.equal(newPrice);
        });
    });

    describe("cancelListing()", () => {
        it("should allow the item owner to cancel the listing", async () => {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1");

            await token.mint(user.address, tokenId);
            await token.connect(user).approve(marketplace.address, tokenId);
            await marketplace.connect(user).list(tokenId, price);

            await expect(marketplace.connect(user).cancelListing(tokenId))
                .to.emit(marketplace, "ListingCanceled")
                .withArgs(token.address, tokenId);

            const listing = await marketplace.listings(1);
            expect(listing.exist).to.equal(false);
        });
    });
});