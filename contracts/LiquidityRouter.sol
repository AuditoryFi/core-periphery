// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./interfaces/IAuditoryAssetPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityRouter {
    event LiquidityAdded(address user, uint256 amount, address token);
    event LiquidityWithdrawn(address user, uint256 amount);

    receive() external payable {}

    function addLiquidity(
        address _lpAddress,
        uint256 _amount,
        address _token
    ) external {
        address _senderAddress = msg.sender;
        require(_amount > 0 ether, "Invalid amount: CANNOT BE ZERO");
        IERC20(_token).transferFrom(_senderAddress, _lpAddress, _amount);
        emit LiquidityAdded(_senderAddress, _amount, _token);
    }

    function removeLiquidity(
        address _lpAddress,
        uint256 _amount,
        address _token
    ) external {
        address _sender = msg.sender;

        IAuditoryAssetPool(_lpAddress).withdraw(_sender, _amount, _token);
        emit LiquidityWithdrawn(_sender, _amount);
    }
}
