const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC721MintRole",  ()=> {
    let aliceAccount, bobAccount;
    let alice, bob;
    let token, Token;

    beforeEach(async () => {
        const signers = await ethers.getSigners();
        aliceAccount = signers[0];
        bobAccount = signers[1];
        alice = aliceAccount.address;
        bob = bobAccount.address;
        Token = await ethers.getContractFactory("ERC721MintRole");
        token = await Token.deploy("ERC721MintRole NFT", "TTT", "https://www.test.com/");
    })

    describe("mint", () => {
        it("mint alice", async () => {
            await expect(token.mint(alice, 1)).to.not.be.reverted;
            await expect(await token.tokenURI(1)).to.be.equal('https://www.test.com/1');
        });
    });
});