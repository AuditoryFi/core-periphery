// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AuditoryApToken.sol";

contract AuditoryAssetPool is AuditoryApToken {
    constructor() {
        manager = msg.sender;
    }

    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);

    address public manager;
    address public artist;
    uint256 public bondValue;

    receive() external payable {}

    // called once by the manager at time of deployment
    function initialize(address _artist, uint256 _bondValue) external {
        require(msg.sender == manager, "AuditoryAssetPool: FORBIDDEN"); // sufficient check
        artist = _artist;
        bondValue = _bondValue;
    }

    function withdraw(
        address _recipient,
        uint256 _amount,
        address _token
    ) external {
        IERC20(_token).approve(address(this), _amount);
        IERC20(_token).transferFrom(address(this), _recipient, _amount);
        emit Withdrawal(_recipient, _amount);
    }
}
