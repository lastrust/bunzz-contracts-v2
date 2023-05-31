import { ethers } from "hardhat";
import { expect } from "chai";
import { ERC721IPFSMintable, ERC721IPFSMintable__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC721IPFSMintable", function () {
    let ERC721IPFSMintableFactory: ERC721IPFSMintable__factory;
    let erc721IPFSMintable: ERC721IPFSMintable;
    let owner: SignerWithAddress, addr1: SignerWithAddress;
    let baseURI = "ipfs://";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        ERC721IPFSMintableFactory = new ERC721IPFSMintable__factory(owner);
        erc721IPFSMintable = (await ERC721IPFSMintableFactory.deploy("MyNFT", "MNFT")) as ERC721IPFSMintable;
        await erc721IPFSMintable.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await erc721IPFSMintable.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await erc721IPFSMintable.balanceOf(owner.address);
            expect(await erc721IPFSMintable.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Transactions", function () {
        it("Should mint a new token", async function () {
            const metadataURI = "QmHash";
            await erc721IPFSMintable.safeMint(owner.address, metadataURI);
            expect(await erc721IPFSMintable.tokenURI(0)).to.equal(baseURI + metadataURI);
        });
    });
});
