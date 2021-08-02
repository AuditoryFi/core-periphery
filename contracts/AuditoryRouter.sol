// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./interfaces/IAuditoryAssetPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AuditoryRouter {
    event LiquidityAdded(address user, uint256 amount, address token);
    event LiquidityWithdrawn(address user, uint256 amount);

    receive() external payable {}

    function addLiquidity(
        address _auditoryAssetPool,
        uint256 _amount,
        address _token
    ) external {
        address _senderAddress = msg.sender;
        require(_amount > 0 ether, "Invalid amount: CANNOT BE ZERO");
        //  TODO: check for the exceeding transfer amount
        // uint256 remainingPoolFund = IAuditoryAssetPool(_auditoryAssetPool)
        // .remainingPoolValue();
        // uint256 _amountToDeposit;
        // require(
        //     remainingPoolFund > 0,
        //     "AssetPool is alread been Liquidated enough!"
        // );
        // if (_amount > remainingPoolFund) {
        //     _amountToDeposit = remainingPoolFund;
        // }
        IERC20(_token).transferFrom(
            _senderAddress,
            _auditoryAssetPool,
            _amount
        );
        emit LiquidityAdded(_senderAddress, _amount, _token);
        // if (_amount > remainingPoolFund)
        //     payable(_senderAddress).transfer(_amount - remainingPoolFund);
    }

    function removeLiquidity(
        address _auditoryAssetPool,
        uint256 _amount,
        address _token
    ) external {
        address _sender = msg.sender;

        IAuditoryAssetPool(_auditoryAssetPool).withdraw(
            _sender,
            _amount,
            _token
        );
        emit LiquidityWithdrawn(_sender, _amount);
    }
}
