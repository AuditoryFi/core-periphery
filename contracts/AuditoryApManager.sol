// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./interfaces/IAuditoryAssetPool.sol";
import "./interfaces/IAuditoryNft.sol";
import "./AuditoryAssetPool.sol";
import "./AuditoryNft.sol";

contract AuditoryApManager {
    address[] public allAssetPools;
    address[] public allNfts;

    mapping(address => AssetPoolInfo[]) public artistWithAps;
    mapping(address => NftInfo[]) public artistWithNft;

    event AssetPoolCreated(
        address artist,
        address assetPool,
        uint256 bondValue
    );
    event NftCreated(
        address artist,
        string name,
        string symbol,
        string spotifyUrl,
        address nftAddress
    );

    struct AssetPoolInfo {
        address apAddress;
        uint256 bondValue;
    }
    struct NftInfo {
        address nftAddress;
        string name;
        string symbol;
        string bio;
        string spotifyUrl;
    }

    function allAssetPoolsLength() external view returns (uint256) {
        return allAssetPools.length;
    }

    function allNftLength() external view returns (uint256) {
        return allNfts.length;
    }

    function getArtistAps() external view returns (AssetPoolInfo[] memory) {
        address _artist = address(msg.sender);
        return artistWithAps[_artist];
    }

    function getArtistNfts(address _senderArtist) external view returns (NftInfo[] memory) {
        address _artist = address(_senderArtist);
        return artistWithNft[_artist];
    }

    function createAssetPool(uint256 _bondValue) external {
        require(_bondValue > 0, "Value of the bond cannot be 0");
        address _artist = address(msg.sender);
        address apAddress;
        AssetPoolInfo[] memory existingAps = artistWithAps[_artist];
        uint256 artistApsLength = existingAps.length;
        //  Deploy Asset pool for the artist
        bytes memory bytecode = type(AuditoryAssetPool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_artist, artistApsLength));
        assembly {
            apAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        //  Set bond value to the created Asset pool for the artist
        IAuditoryAssetPool(apAddress).initialize(_artist, _bondValue);

        artistWithAps[_artist].push(AssetPoolInfo(apAddress, _bondValue));
        allAssetPools.push(apAddress);
        emit AssetPoolCreated(_artist, apAddress, _bondValue);
    }

    function createNft(
        string memory _name,
        string memory _symbol,
        string memory _bio,
        string memory _spotifyUrl
    ) external {
        address nftAddress;
        address _artist = msg.sender;

        //  Deploy NFT for the artist
        bytes memory bytecode = type(AuditoryNft).creationCode;
        bytes memory withContructor = abi.encodePacked(
            bytecode,
            abi.encode(_name, _symbol)
        );
        bytes32 salt = keccak256(abi.encodePacked(_name, _symbol));
        assembly {
            nftAddress := create2(
                0,
                add(withContructor, 32),
                mload(withContructor),
                salt
            )
        }
        IAuditoryNft(nftAddress).initializeArtistInfoAndMint(_artist, _bio);
        artistWithNft[_artist].push(
            NftInfo(nftAddress, _name, _symbol, _bio, _spotifyUrl)
        );
        allNfts.push(nftAddress);
        emit NftCreated(_artist, _name, _symbol, _spotifyUrl, nftAddress);
    }
}
