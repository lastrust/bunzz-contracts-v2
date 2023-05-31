import { ethers } from "hardhat";
import { expect } from "chai";
import { AirdropERC20, MockERC20, AirdropERC20__factory, MockERC20__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("AirdropERC20", function () {
    let owner: SignerWithAddress;
    let recipient1: SignerWithAddress;
    let recipient2: SignerWithAddress;
    let token: MockERC20;
    let airdropContract: AirdropERC20;

    before(async function () {
        [owner, recipient1, recipient2] = await ethers.getSigners();

        const MockTokenFactory = new MockERC20__factory(owner);
        token = await MockTokenFactory.deploy("Mock Token", "MTK");
        await token.deployed();

        const AirdropERC20Factory = new AirdropERC20__factory(owner);
        airdropContract = await AirdropERC20Factory.deploy();
        await airdropContract.deployed();

        // Connect the contract to the ERC20 token
        await airdropContract.connectToOtherContracts([token.address]);
    });


    it("should allow the owner to set the maximum number of recipients", async function () {
        await airdropContract.setMaxRecipientCount(100);

        expect(await airdropContract.maxRecipientCount()).to.equal(100);
    });

    it("should not allow non-owners to set the maximum number of recipients", async function () {
        await expect(
            airdropContract.connect(recipient1).setMaxRecipientCount(200)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await airdropContract.maxRecipientCount()).to.equal(100);
    });

    it("should allow the owner to airdrop tokens to multiple recipients", async function () {
        // Send 500 tokens to the airdrop contract
        await token.transfer(airdropContract.address, 500);

        const recipients = [recipient1.address, recipient2.address];
        const amounts = [100, 200];

        await airdropContract.airdrop(recipients, amounts);

        expect(await token.balanceOf(airdropContract.address)).to.equal(200);
        expect(await token.balanceOf(recipient1.address)).to.equal(100);
        expect(await token.balanceOf(recipient2.address)).to.equal(200);
    });

    it("should not allow non-owners to airdrop tokens", async function () {
        const recipients = [recipient1.address];
        const amounts = [50];

        await expect(
            airdropContract.connect(recipient1).airdrop(recipients, amounts)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await token.balanceOf(recipient1.address)).to.equal(100);
    });

    it("should not allow more than the maximum number of recipients in a single airdrop", async function () {
        const recipients = Array.from(
            { length: 401 },
            (_, i) => ethers.utils.getAddress(`0x${i.toString().padStart(40, '0')}`)
        );
        const amounts = Array.from(
            { length: 401 },
            (_, i) => 1
        );

        await expect(airdropContract.airdrop(recipients, amounts)).to.be.revertedWith(
            "too many recipients"
        );
    });

    it("should allow the owner to retrieve tokens", async function () {
        const initialBalance = await token.balanceOf(owner.address);
        const amount = 50
        await airdropContract.retrieveTokens(amount);

        expect(await token.balanceOf(owner.address)).to.equal(
            initialBalance.add(amount)
        );
    });

    it("should not allow non-owners to retrieve tokens", async function () {
        const initialBalance = await token.balanceOf(owner.address);
        const amount = 50;

        await expect(
            airdropContract.connect(recipient1).retrieveTokens(amount)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });
});
