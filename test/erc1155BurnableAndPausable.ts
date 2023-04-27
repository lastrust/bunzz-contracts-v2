const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ERC1155BurnableAndPausable', () => {
    let contract, owner, addr1, addr2;

    beforeEach(async () => {
        const Contract = await ethers.getContractFactory('ERC1155BurnableAndPausable');
        contract = await Contract.deploy('https://example.com/');
        await contract.deployed();
        [owner, addr1, addr2] = await ethers.getSigners();
    });

    describe('Minting', () => {
        it('Should mint a new token', async () => {
            const tokenId = 1;
            const tokenAmount = 10;
            const data = '0x1234';
            await contract.connect(owner).mint(addr1.address, tokenId, tokenAmount, data);
            const balance = await contract.balanceOf(addr1.address, tokenId);
            expect(balance).to.equal(tokenAmount);
        });

        it('Should mint multiple tokens', async () => {
            const tokenIds = [1, 2, 3];
            const tokenAmounts = [10, 20, 30];
            const data = '0x1234';
            await contract.connect(owner).mintBatch(addr1.address, tokenIds, tokenAmounts, data);
            const balances = await contract.balanceOfBatch([addr1.address, addr1.address, addr1.address], tokenIds);
            expect(balances[0]).to.equal(tokenAmounts[0]);
            expect(balances[1]).to.equal(tokenAmounts[1]);
            expect(balances[2]).to.equal(tokenAmounts[2]);
        });

        it('Should not allow non-minters to mint', async () => {
            const tokenId = 1;
            const tokenAmount = 10;
            const data = '0x1234';
            await expect(contract.connect(addr1).mint(addr2.address, tokenId, tokenAmount, data)).to.be.revertedWith('ERC1155: Must have minter role to mint');
        });
    });

    describe('Pausing', () => {
        it('Should pause the contract', async () => {
            await contract.connect(owner).pause();
            expect(await contract.paused()).to.equal(true);
        });

        it('Should unpause the contract', async () => {
            await contract.connect(owner).pause();
            await contract.connect(owner).unpause();
            expect(await contract.paused()).to.equal(false);
        });

        it('Should not allow non-pausers to pause', async () => {
            await expect(contract.connect(addr1).pause()).to.be.revertedWith('ERC1155: Must have pauser role to pause');
        });

        it('Should not allow non-pausers to unpause', async () => {
            await contract.connect(owner).pause();
            await expect(contract.connect(addr1).unpause()).to.be.revertedWith('ERC1155: Must have pauser role to unpause');
        });
    });
});