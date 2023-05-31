const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoyaltyNFT", function () {
    it("Should mint an NFT with royalties and retrieve the royalty", async function () {
        const RoyaltyNFT = await ethers.getContractFactory("RoyaltyNFT");
        const royaltyNFT = await RoyaltyNFT.deploy("MyNFT", "MNFT");

        await royaltyNFT.deployed();

        const recipient = ethers.Wallet.createRandom().address;
        const royaltyRate = 5000; // 50.00%
        const tokenURI = "https://my-nft.com/1";

        // Mint an NFT with a royalty
        await royaltyNFT.mintWithRoyalty(
            ethers.Wallet.createRandom().address, // Random owner
            1, // Token ID
            tokenURI,
            recipient,
            royaltyRate
        );

        // Retrieve the royalty
        const royalty = await royaltyNFT.getRoyalty(1);

        expect(royalty[0]).to.equal(recipient);
        expect(royalty[1]).to.equal(royaltyRate);
    });
});