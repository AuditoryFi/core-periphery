const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditoryApManager", function () {
  let managerContract;
  // Fof NFT
  const name = "Test";
  const symbol = "TE";
  const bio = "I am an independent music artist";
  const spotifyUrl = "https:spotify.com/user";

  this.beforeAll(async () => {
    const AuditoryApManager = await ethers.getContractFactory(
      "AuditoryApManager"
    );
    managerContract = await AuditoryApManager.deploy();
    await managerContract.deployed();
  });
  it("Initial properties", async function () {
    const allAssetPools = await managerContract.allAssetPoolsLength();
    expect(parseInt(allAssetPools.toString())).to.equal(0);
  });
  it("Create Asset Pool", async function () {
    const [artist] = await ethers.getSigners();

    const createTx = await managerContract.createAssetPool(1000);
    const receipt = await createTx.wait();
    const apCreatedEvent = receipt.events[0];
    expect(parseInt(apCreatedEvent.args.bondValue.toString())).to.equal(1000);
    expect(apCreatedEvent.args.artist).to.equal(artist.address);
    expect(apCreatedEvent.args.assetPool).to.exist;
  });
  it("Asset Pool length", async function () {
    const allAssetPools = await managerContract.allAssetPoolsLength();
    expect(parseInt(allAssetPools.toString())).to.equal(1);
  });
  it("Get asset pool info by artist address", async function () {
    const [assetPool] = await managerContract.getArtistAps();
    expect(parseInt(assetPool.bondValue.toString())).to.equal(1000);
  });
  it("Create NFT", async function () {
    const [artist] = await ethers.getSigners();

    const createTx = await managerContract.createNft(
      name,
      symbol,
      bio,
      spotifyUrl
    );
    const receipt = await createTx.wait();
    const nftCreatedEvent = receipt.events[1];
    expect(nftCreatedEvent.args.artist).to.equal(artist.address);
    expect(nftCreatedEvent.args.name).to.equal(name);
    expect(nftCreatedEvent.args.symbol).to.equal(symbol);
    expect(nftCreatedEvent.args.spotifyUrl).to.equal(spotifyUrl);
  });
  it("NFT length", async function () {
    const allNftLength = await managerContract.allNftLength();
    expect(parseInt(allNftLength.toString())).to.equal(1);
  });
  it("Get NFT by artist address", async function () {
    const [nfts] = await managerContract.getArtistNfts();
    expect(nfts).to.exist;
  });
});
