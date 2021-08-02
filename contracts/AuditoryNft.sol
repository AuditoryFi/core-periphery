// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract AuditoryNft is ERC721 {
    /*
     * Takes name and symbol from the artist for NFT
     * Artist address is set to artist variable
     */
    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        manager = address(msg.sender);
    }

    address public manager;
    address public artist;
    string public artistBio;

    function initializeArtistInfoAndMint(address _artist, string memory _bio)
        external
    {
        require(
            msg.sender == manager,
            "Only manager contract can update the NFT"
        );
        artist = _artist;
        artistBio = _bio;
        _safeMint(_artist, 0);
    }
}
