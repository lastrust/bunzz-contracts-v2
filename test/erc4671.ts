import { ethers } from "hardhat";
import { expect } from "chai";
import { ERC4671, ERC4671__factory } from "../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("ERC4671", () => {
    let erc4671: ERC4671;
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();
        const erc4671Factory = new ERC4671__factory(deployer);
        erc4671 = await erc4671Factory.deploy("Token Name", "TOKEN", "https://token-uri/");
        await erc4671.deployed();
    });

    it("should mint a token", async () => {
        const tx = await erc4671.mint(user.address);
        await tx.wait();

        const balance = await erc4671.balanceOf(user.address);
        expect(balance).to.equal(1);

        const tokenId = balance.sub(1);
        const tokenOwner = await erc4671.ownerOf(tokenId);
        expect(tokenOwner).to.equal(user.address);
    });

    it("should revoke a token", async () => {
        const mintTx = await erc4671.mint(user.address);
        await mintTx.wait();

        const balance = await erc4671.balanceOf(user.address);
        const tokenId = balance.sub(1);

        const isValidBefore = await erc4671.isValid(tokenId);
        expect(isValidBefore).to.be.true;

        const revokeTx = await erc4671.revoke(tokenId);
        await revokeTx.wait();

        const isValidAfter = await erc4671.isValid(tokenId);
        expect(isValidAfter).to.be.false;
    });

    it("should return the correct token URI", async () => {
        const mintTx = await erc4671.mint(user.address);
        await mintTx.wait();

        const balance = await erc4671.balanceOf(user.address);
        const tokenId = balance.sub(1);

        const tokenURI = await erc4671.tokenURI(tokenId);
        expect(tokenURI).to.equal("https://token-uri/0");
    });
});
