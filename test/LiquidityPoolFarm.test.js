const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityPoolFarm", function () {
  let lpfContract;
  let adyContract;
  let adyContractAddress;
  let mockERC20TokenContract;

  const totalTokensBalance = 100000000000;

  this.beforeAll(async () => {
    const [artist, accountTwo, accountThree] = await ethers.getSigners();

    //  For asset pool address
    const AuditoryToken = await ethers.getContractFactory("AuditoryToken");
    adyContract = await AuditoryToken.deploy();
    await adyContract.deployed();
    adyContractAddress = adyContract.address;

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

    //  Mint 10000 to first address
    const mockERC20MinttxForOne = await mockERC20TokenContract.mint(
      accountTwo.address,
      totalTokensBalance
    );
    await mockERC20MinttxForOne.wait();

    //  Mint 10000 to second address
    const mockERC20MinttxForTwo = await mockERC20TokenContract.mint(
      accountThree.address,
      totalTokensBalance
    );
    await mockERC20MinttxForTwo.wait();

    const LiquidityPoolFarm = await ethers.getContractFactory(
      "LiquidityPoolFarm"
    );
    lpfContract = await LiquidityPoolFarm.deploy(
      adyContractAddress,
      mockERC20TokenContract.address,
      1
    );
    await lpfContract.deployed();
  });

  it("Initial properties", async () => {
    const lastRewardBlock = await lpfContract.getLastRewardBlock();
    expect(parseInt(lastRewardBlock.toString())).to.equal(6);
    const accAdyPerShare = await lpfContract.getAccAdyPerShare();
    expect(parseInt(accAdyPerShare.toString())).to.equal(0);
    const BONUS_MULTIPLIER = await lpfContract.BONUS_MULTIPLIER();
    expect(parseInt(BONUS_MULTIPLIER.toString())).to.equal(1);
  });
  it("ADY balance for assetpool", async () => {
    const balance = await adyContract.balanceOf(lpfContract.address);
    expect(parseInt(balance.toString())).to.equal(0);
  });
  it("Deposit from  first account", async () => {
    const _amount = 10000;
    await mockERC20TokenContract.approve(lpfContract.address, _amount);
    const tx = await lpfContract.deposit(_amount);
    const receipt = await tx.wait();
    const depositEvent = receipt.events[2];
    const lastRewardBlock = await lpfContract.getLastRewardBlock();
    const block = await depositEvent.getBlock();
    expect(block.number).to.equal(lastRewardBlock);
    const accAdyPerShare = await lpfContract.getAccAdyPerShare();
    expect(parseInt(accAdyPerShare.toString())).to.equal(0);
  });
  it("Deposit info on first account account", async () => {
    const [accountOne] = await ethers.getSigners();
    const user = await lpfContract.userInfo(accountOne.address);
    expect(parseInt(user.amount.toString())).to.equal(10000);
    const accAdyPerShare = await lpfContract.getAccAdyPerShare();
    expect(parseInt(accAdyPerShare.toString())).to.equal(0);
  });
  it("Deposit from second account", async () => {
    const prevLastRewardBlock = await lpfContract.getLastRewardBlock();
    const [, accountTwo] = await ethers.getSigners();
    const _amount = 10000;
    await mockERC20TokenContract
      .connect(accountTwo)
      .approve(lpfContract.address, _amount);
    const tx = await lpfContract.connect(accountTwo).deposit(_amount);
    const receipt = await tx.wait();
    const depositEvent = receipt.events[2];
    const lastRewardBlock = await lpfContract.getLastRewardBlock();
    const block = await depositEvent.getBlock();
    expect(block.number).to.equal(lastRewardBlock);
    const accAdyPerShare = await lpfContract.getAccAdyPerShare();
    expect(parseInt(accAdyPerShare.toString()) / 10 ** 30).to.equal(0.0002);
    //  user info
    const user = await lpfContract.userInfo(accountTwo.address);
    expect(user.amount.toNumber()).to.equal(_amount);
    expect(user.rewardDebt.toNumber()).to.equal(
      lastRewardBlock - prevLastRewardBlock
    ); // already mined blocks are set as rewardDebt to new comers
  });
  // it("Pending ADY test", async () => {
  //   const [, accountTwo] = await ethers.getSigners();
  //   this.timeout(1000);
  //   await new Promise((res) => {
  //     setTimeout(async () => {
  //       const pendingAdy = await lpfContract.pendingAdy(accountTwo.address);
  //       // console.log("1", pendingAdy.toString());
  //       expect(parseInt(pendingAdy.toString())).to.equal(0);
  //       res();
  //     }, 1000);
  //   });
  //   this.timeout(1000);
  //   return new Promise((res) => {
  //     setTimeout(async () => {
  //       const pendingAdy = await lpfContract.pendingAdy(accountTwo.address);
  //       // console.log("2", pendingAdy.toString());
  //       expect(parseInt(pendingAdy.toString())).to.equal(1);
  //       res();
  //     }, 1000);
  //   });
  // });
  it("Deposit from third account", async () => {
    const prevLastRewardBlock = await lpfContract.getLastRewardBlock();
    const [, , accountThree] = await ethers.getSigners();
    const _amount = 10000;
    await mockERC20TokenContract
      .connect(accountThree)
      .approve(lpfContract.address, _amount);
    const tx = await lpfContract.connect(accountThree).deposit(_amount);
    const receipt = await tx.wait();
    const depositEvent = receipt.events[2];
    const lastRewardBlock = await lpfContract.getLastRewardBlock();
    const block = await depositEvent.getBlock();
    expect(block.number).to.equal(lastRewardBlock);
    const accAdyPerShare = await lpfContract.getAccAdyPerShare();
    expect(parseInt(accAdyPerShare.toString()) / 10 ** 30).to.equal(
      0.0003 // 0.0003 + 0.0001 // This 0.0001 is due to the extra block mining in above test case
    );
    // user info
    const user = await lpfContract.userInfo(accountThree.address);
    expect(user.amount.toNumber()).to.equal(_amount);
    expect(user.rewardDebt.toNumber()).to.equal(
      lastRewardBlock - prevLastRewardBlock
    ); // already mined blocks are set as rewardDebt to new comers
  });
  it("Deposit from second account again", async () => {
    const [, accountTwo] = await ethers.getSigners();
    const _amount = 10000;
    await mockERC20TokenContract
      .connect(accountTwo)
      .approve(lpfContract.address, _amount);
    const tx = await lpfContract.connect(accountTwo).deposit(_amount);
    const receipt = await tx.wait();
    const depositEvent = receipt.events[2];
    const lastRewardBlock = await lpfContract.getLastRewardBlock();
    const block = await depositEvent.getBlock();
    expect(block.number).to.equal(lastRewardBlock);
    const accAdyPerShare = await lpfContract.getAccAdyPerShare();
    expect(parseInt(accAdyPerShare.toString()) / 10 ** 30).to.equal(0.0004); // 0.0004 + 0.0001
  });
  it("Deposit info on second account again", async () => {
    const [, accountTwo, accountThree] = await ethers.getSigners();
    const ApS = await lpfContract.getAccAdyPerShare();
    const accAdyPerShare = parseInt(ApS.toString());
    const user = await lpfContract.userInfo(accountTwo.address);
    console.log("account: 1");
    console.log("amount: ", user.amount.toString());
    console.log("rewardDebt: ", user.rewardDebt.toString());
    const noAm = parseInt(user.amount.toString());
    const noRe = parseInt(user.rewardDebt.toString());
    console.log("balance ADY: ", (noAm * accAdyPerShare) / 10 ** 12 - noRe);
    const user2 = await lpfContract.userInfo(accountThree.address);
    console.log("account: 2");
    console.log("amount: ", user2.amount.toString());
    console.log("rewardDebt: ", user2.rewardDebt.toString());
    console.log(
      "balance ADY2: ",
      user2.amount.mul(ApS).div(1e12).sub(user2.rewardDebt).toString()
    );
    const pending = await lpfContract.pendingAdy(accountTwo.address);
    console.log(pending.toString());
    // const user = await lpfContract.userInfo(invester.address);
    // expect(parseInt(user.amount.toString())).to.equal(10000);
    // expect(parseInt(user.rewardDebt.toString())).to.equal(10000);
    // console.log(user.rewardDebt.toString());
  });
  it("ADY balance for assetpool", async () => {
    const balance = await adyContract.balanceOf(lpfContract.address);
    console.log("Balance");
    console.log(balance.toString());
  });
  it("Withdraw from second account", async () => {
    const [, accountTwo] = await ethers.getSigners();
    const _amount = 20000;
    const tx = await lpfContract.connect(accountTwo).withdraw(_amount);
    const receipt = await tx.wait();
    const withdrawEvent = receipt.events[2];
    const block = await withdrawEvent.getBlock();
    const user = await lpfContract.userInfo(accountTwo.address);
    expect(parseInt(user.amount.toString())).to.equal(0);
    expect(parseInt(user.rewardDebt.toString())).to.equal(0);
  });
});
