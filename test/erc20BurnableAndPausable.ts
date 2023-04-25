const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20BurnableAndPausable",  ()=>{
    let aliceAccount, bobAccount;
    let alice, bob;
    let token, Token;

    beforeEach(async()=>{
        const signers = await ethers.getSigners();
        aliceAccount = signers[0];
        bobAccount = signers[1];
        alice = aliceAccount.address;
        bob = bobAccount.address;
        Token = await ethers.getContractFactory("ERC20BurnableAndPausable");
        token = await Token.deploy("ERC20BurnableAndPausable token", "TTT");
    })

    describe("mint and tansfer", ()=>{
        it("mint and tansfer", async()=>{
            await expect(token.mint(alice, 100)).to.not.be.reverted;
            await expect(token.transfer(bob, 100)).to.not.be.reverted;
        });
    })

})
