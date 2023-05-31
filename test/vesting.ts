import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Vesting, Vesting__factory, MockERC20, MockERC20__factory } from "../typechain-types";

describe("Vesting", () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let vesting: Vesting;
    let token: MockERC20;

    const Decimals = BigNumber.from(18);
    const OneToken = BigNumber.from(10).pow(Decimals);
    const tokenInitialAmount: BigNumber = BigNumber.from(1000000).mul(OneToken);

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();

        const tokenFactory = new MockERC20__factory(deployer);
        token = await tokenFactory.deploy(
            "Test Token",
            "TEST",
            tokenInitialAmount
        );

        const VestingFactory = new Vesting__factory(deployer)
        vesting = await VestingFactory.deploy(token.address);
        await vesting.deployed();
    });

    describe("createVestingSchedule()", () => {
        it("should create a new vesting schedule", async () => {
            const transferAmount = ethers.utils.parseEther("10000");
            await token.transfer(vesting.address, transferAmount);

            // Create a new vesting schedule
            const beneficiary = user.address;
            const start = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
            const cliff = 3600; // 1 hour
            const duration = 3600 * 24; // 1 day
            const slicePeriodSeconds = 3600 * 24; // 1 day
            const amount = ethers.utils.parseEther("1000");

            await vesting.createVestingSchedule(
                beneficiary,
                start,
                cliff,
                duration,
                slicePeriodSeconds,
                amount
            );

            // Assert the vesting schedule details
            const vestingSchedule = await vesting.getVestingScheduleByAddressAndIndex(
                beneficiary,
                0
            );
            expect(vestingSchedule.beneficiary).to.equal(beneficiary);
            expect(vestingSchedule.start).to.equal(start);
            expect(vestingSchedule.cliff).to.equal(start + cliff);
            expect(vestingSchedule.duration).to.equal(duration);
            expect(vestingSchedule.slicePeriodSeconds).to.equal(slicePeriodSeconds);
            expect(vestingSchedule.amountTotal).to.equal(amount);
            expect(vestingSchedule.released).to.equal(0);
        });
    });

    describe("release()", () => {
        it("should release vested tokens", async () => {
            const transferAmount = ethers.utils.parseEther("10000");
            await token.transfer(vesting.address, transferAmount);

            // Create a new vesting schedule
            const beneficiary = user.address;
            const start = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
            const cliff = 3600; // 1 hour
            const duration = 3600 * 24; // 1 day
            const slicePeriodSeconds = 3600 * 24; // 1 day
            const amount = ethers.utils.parseEther("1000");

            await vesting.createVestingSchedule(
                beneficiary,
                start,
                cliff,
                duration,
                slicePeriodSeconds,
                amount
            );

            // Release vested tokens
            await ethers.provider.send("evm_increaseTime", [cliff + duration + 1]); // Fast-forward to after the vesting duration
            const vestingScheduleId = vesting.computeVestingScheduleIdForAddressAndIndex(beneficiary, 0);
            await vesting.release(vestingScheduleId, amount.div(2));

            // Assert the released amount
            const vestingSchedule = await vesting.getVestingScheduleByAddressAndIndex(
                beneficiary,
                0
            );
            expect(vestingSchedule.released).to.equal(amount.div(2));
        });
    });

    describe("withdraw()", () => {
        it("should withdraw tokens from the contract", async () => {
            await token.transfer(vesting.address, tokenInitialAmount);

            // Create a new vesting schedule
            const beneficiary = user.address;
            const start = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
            const cliff = 3600; // 1 hour
            const duration = 3600 * 24; // 1 day
            const slicePeriodSeconds = 3600 * 24; // 1 day
            const amount = ethers.utils.parseEther("1000");

            await vesting.createVestingSchedule(
                beneficiary,
                start,
                cliff,
                duration,
                slicePeriodSeconds,
                amount
            );

            // Release vested tokens
            await ethers.provider.send("evm_increaseTime", [cliff + duration + 1]); // Fast-forward to after the vesting duration
            const vestingScheduleId = vesting.computeVestingScheduleIdForAddressAndIndex(beneficiary, 0);
            await vesting.release(vestingScheduleId, amount.div(2));

            // Get the initial balance before the transfer
            const initialBalance = await token.balanceOf(deployer.address);

            // Withdraw tokens from the contract
            const withdrawAmount = ethers.utils.parseEther("500");
            const recipient = deployer.address;

            await vesting.withdraw(withdrawAmount, recipient);

            // Assert the withdrawn amount and recipient's balance
            const finalBalance = await token.balanceOf(deployer.address);
            const expectedBalance = initialBalance.add(withdrawAmount);
            expect(finalBalance).to.equal(expectedBalance);

            const recipientBalance = await token.balanceOf(recipient);
            expect(recipientBalance).to.equal(withdrawAmount);
        });
    });


    describe("pause() and unpause()", () => {
        it("should pause and unpause the contract", async () => {
            // Pause the contract
            await vesting.pause();
            expect(await vesting.paused()).to.equal(true);

            await token.transfer(vesting.address, tokenInitialAmount);

            // Create a new vesting schedule
            const beneficiary = user.address;
            const start = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
            const cliff = 3600; // 1 hour
            const duration = 3600 * 24; // 1 day
            const slicePeriodSeconds = 3600 * 24; // 1 day
            const amount = ethers.utils.parseEther("1000");

            // Try to create a new vesting schedule while paused
            await expect(
                vesting.createVestingSchedule(
                    beneficiary,
                    start,
                    cliff,
                    duration,
                    slicePeriodSeconds,
                    amount
                )
            ).to.be.revertedWith("Pausable: paused");

            // Unpause the contract
            await vesting.unpause();
            expect(await vesting.paused()).to.equal(false);

            // Create a new vesting schedule after unpausing
            await vesting.createVestingSchedule(
                beneficiary,
                start,
                cliff,
                duration,
                slicePeriodSeconds,
                amount
            );
            const scheduleCount = await vesting.getVestingSchedulesCount();
            expect(scheduleCount).to.equal(1);
        });
    });
});
