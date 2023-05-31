import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MarketplaceNativeERC1155, MockERC1155, MarketplaceNativeERC1155__factory, MockERC1155__factory } from "../typechain-types";

describe("MarketplaceNativeERC1155", () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let marketplace: MarketplaceNativeERC1155;
    let erc1155: MockERC1155;
    const tokenId = 1;
    const amount = 100;
    const price = ethers.utils.parseEther("1");

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();

        const MyERC1155MockFactory = new MockERC1155__factory(deployer);
        erc1155 = await MyERC1155MockFactory.deploy("https://token/");
        await erc1155.deployed();

        const MarketplaceNativeERC1155Factory = new MarketplaceNativeERC1155__factory(deployer);
        marketplace = await MarketplaceNativeERC1155Factory.deploy(erc1155.address);
        await marketplace.deployed();

        await erc1155.mint(deployer.address, tokenId, amount, []);
        await erc1155.setApprovalForAll(marketplace.address, true);
    });

    describe("list()", () => {
        it("should list an item for sale", async () => {
            await marketplace.connect(deployer).list(tokenId, amount, price);

            // Assert the listing details
            const listing = await marketplace.listings(1);
            expect(listing.tokenId).to.equal(tokenId);
            expect(listing.seller).to.equal(deployer.address);
            expect(listing.price).to.equal(price);
            expect(listing.amount).to.equal(amount);
        });
    });

    describe("buy()", () => {
        it("should buy an item", async () => {
            // First, list an item for sale
            await marketplace.connect(deployer).list(tokenId, amount, price);

            // Record the seller's balance before the transaction
            const sellerBalanceBefore = await deployer.getBalance();

            // Record the buyer's balance before the transaction
            const buyerBalanceBefore = await user.getBalance();

            // Buyer sends the required amount of funds
            const transactionResponse = await marketplace.connect(user).buy(1, amount, { value: price.mul(amount) });

            // Get the transaction receipt
            const receipt = await transactionResponse.wait();

            // Check the buyer's balance after the transaction
            const buyerBalanceAfter = await user.getBalance();

            if (receipt.gasUsed && transactionResponse.gasPrice) {
                const gasUsed = receipt.gasUsed.mul(transactionResponse.gasPrice);
                const expectedBuyerBalanceAfter = buyerBalanceBefore.sub(price.mul(amount)).sub(gasUsed);
                expect(buyerBalanceAfter).to.be.closeTo(expectedBuyerBalanceAfter, 10);
            } else {
                console.log("Gas used or gas price was not defined.");
            }
        });
    });



    describe("cancelList()", () => {
        it("should cancel a listing", async () => {
            // First, list an item for sale
            await marketplace.connect(deployer).list(tokenId, amount, price);

            // Cancel the listing
            await marketplace.connect(deployer).cancelList(tokenId);

            // Assert that the listing is no longer active
            const listing = await marketplace.listings(1);
            expect(listing.seller).to.equal(ethers.constants.AddressZero);
            expect(listing.price).to.equal(0);
            expect(listing.amount).to.equal(0);
        });
    });
});
