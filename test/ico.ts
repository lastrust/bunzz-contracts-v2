import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

import { MockERC20, ICO, MockERC20__factory, ICO__factory } from "../typechain-types";

describe("ICO", () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let token: MockERC20;
    let ico: ICO;

    const Decimals = BigNumber.from(18);
    const OneToken = BigNumber.from(10).pow(Decimals);
    const tokenInitialAmount: BigNumber = BigNumber.from(1000).mul(OneToken);

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();

        const MockTokenFactory = new MockERC20__factory(deployer);
        token = await MockTokenFactory.deploy("Mock Token", "MTK");
        await token.deployed();

        const icoFactory = new ICO__factory(deployer);
        const timestamp1 = (await ethers.provider.getBlock("latest")).timestamp;
        const startTime = timestamp1 + 10;
        const endTime = timestamp1 + 3600;

        ico = await icoFactory.deploy(startTime, endTime);

        await token.approve(ico.address, ethers.utils.parseEther("1000000"));
        await ico.connect(deployer).connectToOtherContracts([token.address]);
        await ico.connect(deployer).updatePrice(ethers.utils.parseEther("0.1"));
    });

    describe("buy()", () => {


        it("should revert if the ICO has not started yet", async () => {
            await expect(ico.connect(user).buy()).to.be.revertedWith(
                "ICO: ICO is not started"
            );
        });

        it("should revert if the ICO has ended", async () => {
            await ethers.provider.send("evm_increaseTime", [7200]);
            await expect(ico.connect(user).buy()).to.be.revertedWith(
                "ICO: ICO is end"
            );
        });

        it("should revert if the token amount is not enough", async () => {
            await ethers.provider.send("evm_increaseTime", [200]);

            await ico.connect(deployer).updatePrice(ethers.utils.parseEther("10"));

            const amount = ethers.utils.parseEther("1");
            await expect(
                user.sendTransaction({ to: ico.address, value: amount })
            ).to.be.revertedWith("ICO: Token amount is not enough");
        });


        it("should revert if the ETH amount is invalid", async () => {
            await ethers.provider.send("evm_increaseTime", [200]);
            await expect(
                user.sendTransaction({ to: ico.address, value: ethers.utils.parseEther("0") })
            ).to.be.revertedWith("ICO: ETH amount is invalid");
        });

        it("should allow user to buy token with ETH", async () => {
            await ethers.provider.send("evm_increaseTime", [200]);

            await token.connect(deployer).transfer(ico.address, tokenInitialAmount.div(2));

            const amount = ethers.utils.parseEther("1");
            await user.sendTransaction({ to: ico.address, value: amount });
            await ico.connect(user).buy({value: amount});

            const balance = await token.balanceOf(user.address);
            expect(balance).to.equal(amount.mul(10).mul(2));
        });
    });

    describe("withdrawToken()", () => {
        it("should allow owner to withdraw token", async () => {
            const amount = ethers.utils.parseEther("1000");
            const balance1 = await token.balanceOf(deployer.address);
            await token.transfer(ico.address, amount);
            await ico.connect(deployer).withdrawToken();

            const balance2 = await token.balanceOf(deployer.address);
            expect(balance1).to.equal(balance2);
        });
    });

    describe("withdrawETH()", () => {
        it("should withdraw ETH correctly", async () => {
            await ethers.provider.send("evm_increaseTime", [200]);
            await token.connect(deployer).transfer(ico.address, tokenInitialAmount.div(2));

            const balanceBefore = await ethers.provider.getBalance(deployer.address);

            const amount = ethers.utils.parseEther("1");
            const gasPrice = await ethers.provider.getGasPrice();
            const gasLimit = await ico.estimateGas.withdrawETH();
            const tx = await ico.connect(deployer).withdrawETH({ gasPrice, gasLimit });
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(gasPrice);
            const transactionCost = gasUsed.add(amount);

            const balanceAfter = await ethers.provider.getBalance(deployer.address);
            expect(balanceAfter).to.equal(balanceBefore.add(amount).sub(transactionCost));
        });

    });
});