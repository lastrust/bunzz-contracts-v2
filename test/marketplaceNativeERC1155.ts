import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MarketplaceNativeERC1155 } from "../typechain-types";

describe("MarketplaceNativeERC1155", () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let marketplace: MarketplaceNativeERC1155;

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();

        const MarketplaceNativeERC1155Factory = await ethers.getContractFactory("MarketplaceNativeERC1155");
        marketplace = await MarketplaceNativeERC1155Factory.deploy(/* pass the ERC1155 token address */);
        await marketplace.deployed();
    });

    describe("list()", () => {
        it("should list an item for sale", async () => {
            const tokenId = 1;
            const amount = 1;
            const price = ethers.utils.parseEther("1");

            await marketplace.list(tokenId, amount, price);

            // Assert the listing details
            const listing = await marketplace.listings(tokenId);
            expect(listing.tokenId).to.equal(tokenId);
            expect(listing.seller).to.equal(deployer.address);
            expect(listing.price).to.equal(price);
            expect(listing.amount).to.equal(amount);
        });
    });

    describe("buy()", () => {
        it("should buy an item", async () => {
            // First, list an item for sale
            const tokenId = 1;
            const amount = 1;
            const price = ethers.utils.parseEther("1");
            await marketplace.list(tokenId, amount, price);

            // Buyer sends the required amount of funds
            const buyerBalanceBefore = await deployer.getBalance();
            const transaction = await marketplace.connect(user).buy(tokenId, amount, { value: price });

            // Check the buyer's balance after the transaction
            const buyerBalanceAfter = await deployer.getBalance();
            const gasUsed = transaction.gasUsed.mul(transaction.effectiveGasPrice);
            const expectedBalanceAfter = buyerBalanceBefore.sub(price).sub(gasUsed);
            expect(buyerBalanceAfter).to.equal(expectedBalanceAfter);

            // Check the seller's balance after the transaction
            const sellerBalance = await deployer.getBalance();
            expect(sellerBalance).to.equal(price);

            // Assert that the item is no longer listed
            const listing = await marketplace.listings(tokenId);
            expect(listing.exist).to.equal(false);
        });
    });

    describe("cancelList()", () => {
        it("should cancel a listing", async () => {
            // First, list an item for sale
            const tokenId = 1;
            const amount = 1;
            const price = ethers.utils.parseEther("1");
            await marketplace.list(tokenId, amount, price);

            // Cancel the listing
            await marketplace.connect(deployer).cancelList(tokenId);

            // Assert that the listing is no longer active
            const listing = await marketplace.listings(tokenId);
            expect(listing.exist).to.equal(false);
        });
    });
});
