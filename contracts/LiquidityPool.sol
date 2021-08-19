// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LiquidityPool is ERC20 {
    using SafeMath for uint256;

    constructor(address _token) ERC20("Auditory-LP tokens", "ADY-LP") {
        token = _token;
    }

    uint112 private previousBalance;
    address private token;
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    function getReserve() public view returns (uint112 _reserve) {
        _reserve = previousBalance;
    }

    function mint(address _sender) external returns (uint256 liquidity) {
        uint112 _prevBalance = getReserve();
        uint256 _currentBalance = IERC20(token).balanceOf(_sender);
        uint256 amountToMintFor = _currentBalance.sub(_prevBalance);
        uint256 _totalSupply = totalSupply();

        //  TODO: Rewrite the logic.
        if (_totalSupply == 0) {
            liquidity = amountToMintFor.sub(MINIMUM_LIQUIDITY);
            _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            // liquidity =
        }

        //  TODO: Sub fee here
        _mint(_sender, amountToMintFor);
        _update(_currentBalance);
    }

    function burn(address _to) external returns (uint256 amount) {
        uint256 liquidity = balanceOf(address(this));
        _burn(_to, liquidity);
        uint256 tokenBalance = IERC20(token).balanceOf(address(this));
        uint256 _totalSupply = totalSupply();
        amount = liquidity.mul(tokenBalance) / _totalSupply;
        // _safeTransfer(token, to, amount);
        ERC20(token).transfer(_to, amount);
        uint256 _currentBalance = IERC20(token).balanceOf(address(this));
        _update(_currentBalance);
    }

    function _update(uint256 _balance) private {
        previousBalance = uint112(_balance);
    }
}
