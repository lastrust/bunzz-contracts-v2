import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from "chai";

import {
    ERC20MaxSupply
} from "../typechain-types";


describe("ERC20MaxSupply", () => {
    let owner: Signer;
    let other: Signer;
    let token: ERC20MaxSupply;

    const name = "MyToken";
    const symbol = "MTK";
    const maxSupply = ethers.utils.parseEther("1000000");

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();
        const tokenFactory = await ethers.getContractFactory("ERC20MaxSupply");
        token = await tokenFactory.deploy(name, symbol, maxSupply);

        await token.connect(owner).mint(await other.getAddress(), ethers.utils.parseEther("1000"));
    });

    it("should have the correct name, symbol, and max supply", async () => {
        expect(await token.name()).to.equal(name);
        expect(await token.symbol()).to.equal(symbol);
        expect(await token.maxSupply()).to.equal(maxSupply);
    });

    it("should allow the owner to mint tokens up to the max supply", async () => {
        const initialSupply = await token.totalSupply();
        const amount = ethers.utils.parseEther("10000");

        await token.connect(owner).mint(await other.getAddress(), amount);

        expect(await token.totalSupply()).to.equal(initialSupply.add(amount));
    });

    it("should not allow minting tokens beyond the max supply", async () => {
        const amount = maxSupply.sub(await token.totalSupply()).add(ethers.utils.parseEther("1"));

        await expect(token.connect(owner).mint(await other.getAddress(), amount)).to.be.revertedWith("maxSupply exceeded");
    });

    it("should allow the owner to pause and unpause transfers", async () => {
        await token.connect(owner).pause();
        expect(await token.paused()).to.be.true;

        await token.connect(owner).unpause();
        expect(await token.paused()).to.be.false;
    });

    it("should not allow non-pauser to pause or unpause transfers", async () => {
        await expect(token.connect(other).pause()).to.be.revertedWith("Must have pauser role to pause");
        await expect(token.connect(other).unpause()).to.be.revertedWith("Must have pauser role to unpause");
    });

    it("should not allow burning tokens beyond the balance", async () => {
        const balance = await token.balanceOf(await other.getAddress());

        await expect(token.connect(other).burn(balance.add(ethers.utils.parseEther("1")))).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
});
