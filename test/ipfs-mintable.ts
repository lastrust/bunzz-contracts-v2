import { ethers } from "hardhat";
import { expect } from "chai";
import { ERC721IPFSMintable, ERC721IPFSMintable__factory } from "../typechain-types";

describe("ERC721IPFSMintable", () => {
    let contract: ERC721IPFSMintable;

    beforeEach(async () => {
        const [deployer] = await ethers.getSigners();
        const ERC721IPFSMintableFactory = new ERC721IPFSMintable__factory(deployer);
        contract = await ERC721IPFSMintableFactory.deploy("MyToken", "MT");
        await contract.deployed();
    });

    it("should set the correct base URI", async () => {
        const baseURI = await contract.baseURI();
        expect(baseURI).to.equal("ipfs://");
    });

    it("should mint and retrieve token metadata", async () => {
        const [deployer, user] = await ethers.getSigners();

        const tokenId = 0;
        const ownerBefore = await contract.ownerOf(tokenId);
        expect(ownerBefore).to.equal(deployer.address);

        const isValidBefore = await contract._exists(tokenId);
        expect(isValidBefore).to.be.true;

        const tokenURI = await contract.tokenURI(tokenId);
        expect(tokenURI).to.equal("ipfs://0");

        const balanceBefore = await contract.balanceOf(deployer.address);
        expect(balanceBefore).to.equal(1);
    });

    it("should revoke a token", async () => {
        const [deployer, user] = await ethers.getSigners();

        const tokenId = 0;
        await contract.burn(tokenId);

        const isValidAfter = await contract._exists(tokenId);
        expect(isValidAfter).to.be.false;
    });
});
