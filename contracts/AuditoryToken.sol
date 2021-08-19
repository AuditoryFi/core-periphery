// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AuditoryToken is ERC20 {
    constructor() ERC20("Auditory", "ADY") {}

    //  TODO: Currently public to ease testing.
    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
