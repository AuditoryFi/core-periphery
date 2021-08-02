const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditoryAssetPool", function () {
  let assetPoolContract;
  let mockERC20TokenContract;
  const totalTokensBalance = 10000;

  this.beforeAll(async () => {
    const [, artist] = await ethers.getSigners();
    const AuditoryAssetPool = await ethers.getContractFactory(
      "AuditoryAssetPool"
    );
    assetPoolContract = await AuditoryAssetPool.deploy();
    await assetPoolContract.deployed();

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

  it("Initial properties", async () => {
    const [manager] = await ethers.getSigners();
    expect(await assetPoolContract.manager()).to.equal(manager.address);
    const bondValue = await assetPoolContract.bondValue();
    expect(parseInt(bondValue.toString())).to.equal(0);
    expect(await assetPoolContract.artist()).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("Initialization with artist and bondVaue", async () => {
    const [manager, addressOne] = await ethers.getSigners();
    const bondValue = 1000;
    expect(await assetPoolContract.initialize(manager.address, bondValue)).to
      .throw;
    const artist = addressOne.address;
    await assetPoolContract.initialize(artist, bondValue);
    const bondValueFromContract = await assetPoolContract.bondValue();
    expect(parseInt(bondValueFromContract.toString())).to.equal(1000);
    expect(await assetPoolContract.artist()).to.equal(artist);
  });

  it("Initial totalSupply", async () => {
    const totalSupply = await assetPoolContract.totalSupply();
    expect(parseInt(totalSupply.toString())).to.equal(0);
  });
  it("Deposit", async () => {
    const [, addressOne] = await ethers.getSigners();
    const _amount = 100;
    const depositTx = await assetPoolContract.deposit(
      addressOne.address,
      _amount
    );
    const receipt = await depositTx.wait();
    const event = receipt.events[0];
    expect(event.args.sender).to.equal(addressOne.address);
    expect(event.args.amount).to.equal(_amount);
    const totalSupply = await assetPoolContract.totalSupply();
    expect(parseInt(totalSupply.toString())).to.equal(100);
  });
  //  TODO: Cannot be tested, needs to be moved to router contract
  // it("Withdraw", async () => {
  //   const [manager, addressOne] = await ethers.getSigners();
  //   const _amount = 50;
  //   const withdrawTx = await assetPoolContract.withdraw(
  //     addressOne.address,
  //     _amount,
  //     mockERC20TokenContract.address
  //   );
  //   const receipt = await withdrawTx.wait();
  //   const event = receipt.events[0];
  //   expect(event.args.recipient).to.equal(addressOne.address);
  //   expect(event.args.amount).to.equal(_amount);
  //   expect(parseInt(totalSupply.toString())).to.equal(50);
  // });
});
