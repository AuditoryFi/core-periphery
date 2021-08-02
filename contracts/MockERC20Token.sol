// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20Token is ERC20 {
    constructor() ERC20("Mock DAI Stablecoin", "mDAI") {}

    function mint(address _receiver, uint256 _amount) external {
        _mint(_receiver, _amount);
    }
}
