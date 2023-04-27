const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20MaxSupply",  ()=>{
    let aliceAccount, bobAccount;
    let alice, bob;
    let token, Token;
    const maxSupply = "100000000000000000000"

    beforeEach(async()=>{
        const signers = await ethers.getSigners();
        aliceAccount = signers[0];
        bobAccount = signers[1];
        alice = aliceAccount.address;
        bob = bobAccount.address;
        Token = await ethers.getContractFactory("ERC20MaxSupply");
        token = await Token.deploy("ERC20MaxSupply test", "TTT", maxSupply);
    })

    describe("mint", ()=>{
        it("should mint amount that keep total supply under max supply", async()=>{
            await expect(token.mint(bob, 100)).to.not.be.reverted;
        });

        it("should mint amount that goes over cap", async()=>{
            let amount = "300000000000000000000"
            await expect(token.mint(bob, amount)).to.be.revertedWith("maxSupply exceeded")
        });
    })

    describe("maxSupply", ()=>{
        it("should check maxSupply value", async()=>{
            let r = await token.maxSupply();
            expect(r.toString()).to.equal(maxSupply)
        })
    })
})
