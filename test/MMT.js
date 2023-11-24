const { expect } = require("chai");
const { ethers } = require("hardhat");

const ADMIN = ethers.utils.formatBytes32String(0x0000000000000000000000000000000000000000000000000000000000000000);
const MINTER = ethers.utils.formatBytes32String(0x0000000000000000000000000000000000000000000000000000000000000001);

const deploy = async () => {
	//getting accounts
	const [admin, minter] = await ethers.getSigners();
	//deploying contract
	const Contract = await ethers.getContractFactory("MMT");
	const mmt = await Contract.deploy(admin.address, minter.address);
	return { admin, minter, mmt };
};

describe("MMT", function () {
	it("Deployment should assign contract creator as admin", async function () {
		const { admin, minter, mmt } = await deploy();

		expect(await mmt.hasRole(ADMIN, admin.address)).to.equal(true);
	});

	it("total supply should be set to 1 billion", async () => {
		const { admin, minter, mmt } = await deploy();

		expect((await mmt.totalSupply()).toString()).to.equal("1000000000000000000000000000");
	});

	it("Only minter should be able to mint", async () => {
		const { admin, minter, mmt } = await deploy();

		//trying to mint with admin
		await expect(mmt.connect(admin).mint(admin.address, "3333")).to.be.reverted;

		//minting as minter
		await expect(mmt.connect(minter).mint(minter.address, "3333")).to.not.be.reverted;
		expect((await mmt.totalSupply()).toString()).to.equal("1000000000000000000000003333");
	});

	it("Should be able to grant and revoke Administratorship", async () => {
		const { admin, minter, mmt } = await deploy();
		const account3 = (await ethers.getSigners())[3];

		//granting admin permissions to account3
		await mmt.connect(admin).grantRole(ADMIN, account3.address);
		expect(await mmt.hasRole(ADMIN, account3.address)).to.equal(true);

		//revoking own admin permission for admin
		await mmt.connect(admin).revokeRole(ADMIN, admin.address);
		expect(await mmt.hasRole(ADMIN, admin.address)).to.equal(false);
	});

	it("only Admin can revoke permissions minter", async () => {
		const { admin, minter, mmt } = await deploy();

		//admin revokes minter permission for minter
		expect(async () => await mmt.connect(admin).revokeRole(MINTER, minter.address)).to.change(
			async () => await mmt.hasRole(MINTER, minter.address)
		);
	});

	it("Should be able to renounce own permission", async () => {
		const { admin, minter, mmt } = await deploy();

		//minter renounces his own permission
		expect(async () => await mmt.connect(minter).renounceRole(MINTER, minter.address)).to.change(
			async () => await mmt.hasRole(MINTER, minter.address)
		);
	});
});
