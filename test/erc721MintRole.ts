import { BigNumber as BN, constants } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const Decimals = BN.from(18);
const OneToken = BN.from(10).pow(Decimals);

import {
    ERC721MintRole,
    ERC721MintRole__factory,
} from "../typechain-types";
import {max} from "hardhat/internal/util/bigint";
import {equal} from "assert";

describe("Test ERC721MintRole contract",  ()=> {
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    let erc721Contract: ERC721MintRole;

    before(async () => {
        [owner, user1, user2] = await ethers.getSigners();
    });

    describe("1. Deploy contracts", () => {
        it("Deploy main contracts", async () => {
            const erc721Factory = new ERC721MintRole__factory(owner);
            erc721Contract = await erc721Factory.deploy(
                "ERC721MintRole NFT Token",
                "TTT",
                "https://www.test.com/"
            );
        });
    });

    describe("2. Test main functions", () => {
        describe("- mint function", () => {
            it("mint: pass", async () => {
                await expect(erc721Contract.mint(owner.address, 1)).to.not.be.reverted;
                await expect(await erc721Contract.tokenURI(1)).to.be.equal('https://www.test.com/1');
            });
        })
    })
});
