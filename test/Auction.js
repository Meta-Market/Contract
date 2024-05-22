const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction Contract Tests", function () {
	let Auction, auction;
	let MMT, mmtToken;
	let MetaShelves, metaShelves;
	let owner, bidder1, bidder2, nonBidder;

	beforeEach(async function () {
		[owner, bidder1, bidder2, nonBidder] = await ethers.getSigners();

		// Deploy MMT token
		MMT = await ethers.getContractFactory("MMT");
		mmtToken = await MMT.deploy();
		await mmtToken.deployed();

		// Deploy MetaShelves contract
		MetaShelves = await ethers.getContractFactory("MetaShelves");
		metaShelves = await MetaShelves.deploy();
		await metaShelves.deployed();

		// Mint MMT tokens for testing
		const mintAmount = ethers.utils.parseEther("1000");
		await mmtToken.mint(bidder1.address, mintAmount);
		await mmtToken.mint(bidder2.address, mintAmount);

		// Deploy Auction contract
		Auction = await ethers.getContractFactory("Auction");
		auction = await Auction.deploy(mmtToken.address, metaShelves.address);
		await auction.deployed();

		// Approve the auction contract to spend MMT tokens on behalf of bidders
		await mmtToken.connect(bidder1).approve(auction.address, mintAmount);
		await mmtToken.connect(bidder2).approve(auction.address, mintAmount);
	});

	it("Should start an auction correctly", async function () {
		const tokenId = 1;
		const minBid = ethers.utils.parseEther("1");
		const duration = 86400; // 1 day

		await expect(auction.connect(owner).startAuction(tokenId, minBid, duration))
			.to.emit(auction, "AuctionStarted")
			.withArgs(tokenId, 3000, minBid, duration);

		const auctionDetails = await auction.auctions(0);
		expect(auctionDetails.tokenId).to.equal(tokenId);
		expect(auctionDetails.minBid).to.equal(minBid);
		expect(auctionDetails.duration).to.equal(duration);
		expect(auctionDetails.ended).to.equal(false);
	});

	it("Should allow bids higher than current highest bid", async function () {
		const tokenId = 1;
		const minBid = ethers.utils.parseEther("1");
		const duration = 86400; // 1 day
		await auction.connect(owner).startAuction(tokenId, minBid, duration);

		const bidAmount1 = ethers.utils.parseEther("2");
		await expect(auction.connect(bidder1).bid(0, bidAmount1))
			.to.emit(auction, "BidPlaced")
			.withArgs(bidder1.address, bidAmount1);

		const bidAmount2 = ethers.utils.parseEther("3");
		await expect(auction.connect(bidder2).bid(0, bidAmount2))
			.to.emit(auction, "BidPlaced")
			.withArgs(bidder2.address, bidAmount2);

		const auctionDetails = await auction.auctions(0);
		expect(auctionDetails.highestBidder).to.equal(bidder2.address);
		expect(auctionDetails.highestBid).to.equal(bidAmount2);
	});

	it("Should not allow bids lower than current highest bid", async function () {
		const tokenId = 1;
		const minBid = ethers.utils.parseEther("1");
		const duration = 86400; // 1 day
		await auction.connect(owner).startAuction(tokenId, minBid, duration);

		const bidAmount1 = ethers.utils.parseEther("2");
		await auction.connect(bidder1).bid(0, bidAmount1);

		const lowerBidAmount = ethers.utils.parseEther("1.5");
		await expect(auction.connect(bidder2).bid(0, lowerBidAmount)).to.be.revertedWith(
			"Bid must be greater than highest bid"
		);
	});

	it("Should end the auction and transfer tokens correctly", async function () {
		const tokenId = 1;
		const minBid = ethers.utils.parseEther("1");
		const duration = 86400; // 1 day
		await auction.connect(owner).startAuction(tokenId, minBid, duration);

		const bidAmount = ethers.utils.parseEther("2");
		await auction.connect(bidder1).bid(0, bidAmount);

		// Fast-forward time to simulate auction end
		await ethers.provider.send("evm_increaseTime", [duration + 1]);
		await ethers.provider.send("evm_mine");

		await expect(auction.connect(owner).endAuction(0))
			.to.emit(auction, "AuctionEnded")
			.withArgs(bidder1.address, bidAmount);

		const auctionDetails = await auction.auctions(0);
		expect(auctionDetails.ended).to.equal(true);

		// Additional checks can be made here for token transfer, etc.
	});

	// Add more tests for edge cases and other functionalities as needed.
});
