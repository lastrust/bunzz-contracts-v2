
import { BigNumber as BN, constants } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const Decimals = BN.from(18);
const OneToken = BN.from(10).pow(Decimals);

import {
    ERC20BurnableAndPausable,
    ERC20BurnableAndPausable__factory,
} from "../typechain-types";
import {max} from "hardhat/internal/util/bigint";
import {equal} from "assert";

describe("Test ERC20BurnableAndPausable contract",  ()=>{
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    let erc20Contract: ERC20BurnableAndPausable;

    before(async () => {
        [owner, user1, user2] = await ethers.getSigners();
    });

    describe("1. Deploy contracts", () => {
        it("Deploy main contracts", async () => {
            const erc20Factory = new ERC20BurnableAndPausable__factory(owner);
            erc20Contract = await erc20Factory.deploy(
                "ERC20BurnableAndPausable Token",
                "TTT"
            );
        });
    });

    describe("2. Test main functions", () => {
        describe("- mint function", () => {
            it("mint: pass", async () => {
                await erc20Contract.mint(owner.address, OneToken.mul(100));
            });

            it("mint: after paused", async () => {
                await erc20Contract.pause();
                await expect(
                    erc20Contract.mint(user1.address, OneToken.mul(100))
                ).to.be.revertedWith("ERC20Pausable: token transfer while paused");
            });

            it("mint: after unPaused", async () => {
                await erc20Contract.unpause();
                await erc20Contract.mint(user1.address, OneToken.mul(100));
            });
        });
    });
})
