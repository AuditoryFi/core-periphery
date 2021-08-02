// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IAuditoryAssetPool {
    function deposit(address sender, uint256 amount) external;

    function withdraw(
        address recipient,
        uint256 amount,
        address token
    ) external;

    function initialize(address artist, uint256 bondValue) external;
}
