const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC4907 Contract Tests", function () {
	let erc4907;
	let owner, user1, user2;

	beforeEach(async function () {
		[owner, user1, user2] = await ethers.getSigners();
		const ERC4907 = await ethers.getContractFactory("ERC4907", owner);
		erc4907 = await ERC4907.deploy();
	});

	it("Should mint a new NFT successfully", async function () {
		await expect(erc4907.connect(owner).nftMint())
			.to.emit(erc4907, "Transfer")
			.withArgs(ethers.constants.AddressZero, owner.address, 1);
		expect(await erc4907.ownerOf(1)).to.equal(owner.address);
	});

	it("Should set and retrieve user info correctly", async function () {
		const tokenId = 1;
		const now = Math.floor(Date.now() / 1000);
		const expiration = now + 100000;

		// Mint a new token
		await erc4907.connect(owner).nftMint();

		// Set user
		await erc4907.connect(owner).setUser(tokenId, user1.address, expiration);
		const userInfo = await erc4907.userOf(tokenId);

		expect(userInfo).to.equal(user1.address);
		expect(await erc4907.userExpires(tokenId)).to.equal(expiration);
	});

	it("Should not allow non-owner to set user", async function () {
		const tokenId = 1;
		const now = Math.floor(Date.now() / 1000);
		const expiration = now + 100000;

		// Mint a new token
		await erc4907.connect(owner).nftMint();

		// Attempt to set user by non-owner
		await expect(erc4907.connect(user1).setUser(tokenId, user2.address, expiration)).to.be.revertedWith(
			"ERC721: transfer caller is not owner nor approved"
		);
	});

	it("Should remove user after expiration", async function () {
		const tokenId = 1;
		const now = Math.floor(Date.now() / 1000);
		const expiration = now + 100; // Increase this to a larger value

		// Mint a new token
		await erc4907.connect(owner).nftMint();

		// Set user with a future expiration
		await erc4907.connect(owner).setUser(tokenId, user1.address, expiration);

		// Simulate time passing beyond expiration
		await ethers.provider.send("evm_increaseTime", [101]); // Adjust this to be slightly more than the expiration
		await ethers.provider.send("evm_mine");

		expect(await erc4907.userOf(tokenId)).to.equal(ethers.constants.AddressZero);
	});

	// Additional tests can be added here to cover other functionalities
});
