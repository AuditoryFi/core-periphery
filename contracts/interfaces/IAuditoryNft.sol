// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuditoryNft {
    function initializeArtistInfoAndMint(address _artist, string memory _bio)
        external;
}
