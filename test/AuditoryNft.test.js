const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditoryNft", function () {
  let nftContract;
  const name = "Test";
  const symbol = "TE";
  const bio = "I am an independent music artist";

  this.beforeAll(async () => {
    const AuditoryNft = await ethers.getContractFactory("AuditoryNft");
    nftContract = await AuditoryNft.deploy(name, symbol);
    await nftContract.deployed();
  });

  it("Initial properties", async () => {
    const [owner] = await ethers.getSigners();
    const _name = await nftContract.name();
    const _symbol = await nftContract.symbol();
    expect(_name.toString()).to.equal(name);
    expect(_symbol.toString()).to.equal(symbol);

    const manager = await nftContract.manager();
    expect(manager.toString()).to.equal(owner.address);
    const artist = await nftContract.artist();
    const artistBio = await nftContract.artistBio();
    expect(artist.toString()).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(artistBio.toString()).to.equal("");
  });

  it("Initialization and Minting", async () => {
    const [, artist] = await ethers.getSigners();
    const nftTx = await nftContract.initializeArtistInfoAndMint(
      artist.address,
      bio
    );
    const receipt = await nftTx.wait();
    expect(receipt.events);
    const artistFromContract = await nftContract.artist();
    const artistBio = await nftContract.artistBio();
    expect(artistFromContract.toString()).to.equal(artist.address);
    expect(artistBio.toString()).to.equal(bio);
  });
});
