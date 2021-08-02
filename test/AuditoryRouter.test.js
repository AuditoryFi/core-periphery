const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditoryAssetPool", function () {
  let routerContract;
  let assetPoolAddress;
  let assetPoolContract;
  let mockERC20TokenContract;

  const totalTokensBalance = 10000;

  this.beforeAll(async () => {
    const [artist] = await ethers.getSigners();
    const AuditoryRouter = await ethers.getContractFactory("AuditoryRouter");
    routerContract = await AuditoryRouter.deploy();
    await routerContract.deployed();

    //  For asset pool address
    const AuditoryAssetPool = await ethers.getContractFactory(
      "AuditoryAssetPool"
    );
    assetPoolContract = await AuditoryAssetPool.deploy();
    await assetPoolContract.deployed();
    assetPoolAddress = assetPoolContract.address;

    //  Mock tokens for liquidity
    const MockERC20Token = await ethers.getContractFactory("MockERC20Token");
    mockERC20TokenContract = await MockERC20Token.deploy();
    await mockERC20TokenContract.deployed();

    //  Mint 10000 to address
    const mockERC20Minttx = await mockERC20TokenContract.mint(
      artist.address,
      totalTokensBalance
    );
    await mockERC20Minttx.wait();
  });

  it("Add Liquidity", async () => {
    const [artist] = await ethers.getSigners();
    const currentBalance = await mockERC20TokenContract.balanceOf(
      artist.address
    );
    expect(parseInt(currentBalance.toString())).to.equal(totalTokensBalance);

    const _amount = 100;
    //  To let the user know the no of tokens that are being transferred
    await mockERC20TokenContract.approve(routerContract.address, _amount);
    const addLiquidityTx = await routerContract.addLiquidity(
      assetPoolAddress,
      _amount,
      mockERC20TokenContract.address
    );
    const receipt = await addLiquidityTx.wait();

    const newBalance = await mockERC20TokenContract.balanceOf(artist.address);
    expect(parseInt(newBalance.toString())).to.equal(
      totalTokensBalance - _amount
    );
  });
  it("Asset pool balance after add liquidity", async () => {
    const [artist] = await ethers.getSigners();
    const _amount = 100;
    const balance = await assetPoolContract.balanceOf(artist.address);
    expect(parseInt(balance.toString())).to.equal(_amount);
    // Current wallet balance
    const currentBalance = await mockERC20TokenContract.balanceOf(
      assetPoolAddress
    );
    expect(parseInt(currentBalance.toString())).to.equal(_amount);
  });
  it("Remove Liquidity", async () => {
    const [artist] = await ethers.getSigners();
    const _amount = 100;
    // await mockERC20TokenContract.approve(assetPoolAddress, _amount);
    const removeLiquidityTx = await routerContract.removeLiquidity(
      assetPoolAddress,
      _amount,
      mockERC20TokenContract.address
    );
    const receipt = await removeLiquidityTx.wait;
    const newBalance = await mockERC20TokenContract.balanceOf(artist.address);
    expect(parseInt(newBalance.toString())).to.equal(totalTokensBalance);
  });
  it("Asset pool balance after remove liquidity", async () => {
    const [artist] = await ethers.getSigners();
    const balance = await assetPoolContract.balanceOf(artist.address);
    expect(parseInt(balance.toString())).to.equal(0);
    // Current wallet balance
    const currentBalance = await mockERC20TokenContract.balanceOf(
      assetPoolAddress
    );
    expect(parseInt(currentBalance.toString())).to.equal(0);
  });
});
