// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAuditoryToken.sol";

import "hardhat/console.sol";

contract LiquidityPoolFarm is Ownable {
    using SafeMath for uint256;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of CAKEs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accAdyPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accAdyPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 amount);

    IAuditoryToken private adyToken;
    IERC20 private poolToken;
    uint256 private lastRewardBlock;
    //  accAdyPerShare = accumulated ady token per DAI
    uint256 private accAdyPerShare;
    // ADY tokens created per block.
    uint256 public adyPerBlock; // times 1e18

    // Info of each user that stakes LP tokens.
    mapping(address => UserInfo) public userInfo;

    // Bonus muliplier for early ADY makers.
    uint256 public BONUS_MULTIPLIER = 1;

    constructor(
        address _adyToken,
        address _poolToken,
        uint256 _adyPerBlock
    ) {
        adyToken = IAuditoryToken(_adyToken);
        poolToken = IERC20(_poolToken);
        adyPerBlock = _adyPerBlock;
        lastRewardBlock = block.number;
        accAdyPerShare = 0;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function getLastRewardBlock() public view returns (uint256) {
        return lastRewardBlock;
    }

    function getAccAdyPerShare() public view returns (uint256) {
        return accAdyPerShare;
    }

    //  Just for testing
    function getCurrentBlockNumber() public view returns (uint256) {
        return block.number;
    }

    // Deposit LP tokens to MasterChef for CAKE allocation.
    function deposit(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        // if (user.amount > 0) {
        //     uint256 pending = user.amount.mul(accAdyPerShare).div(1e12).sub(
        //         user.rewardDebt
        //     );
        //     if (pending > 0) {
        //         safeAdyTransfer(msg.sender, pending.mul(1e18));
        //         emit Harvest(msg.sender, pending.mul(1e18));
        //     }
        // }
        if (_amount > 0) {
            poolToken.transferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount.div(1e18));
        }
        user.rewardDebt = user.amount.mul(accAdyPerShare).div(1e12);
        emit Deposit(msg.sender, _amount);
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        uint256 daiSupply = poolToken.balanceOf(address(this));
        if (daiSupply == 0) {
            // console.log("stat", block.number);
            lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
        uint256 adyReward = multiplier.mul(adyPerBlock);
        // token.mint(devaddr, adyReward.div(10));
        //  To governance contract
        IAuditoryToken(adyToken).mint(address(this), adyReward.mul(1e18));
        accAdyPerShare = accAdyPerShare.add(adyReward.mul(1e30).div(daiSupply));
        // console.log("accAdyPerShare", accAdyPerShare);
        lastRewardBlock = block.number;
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        updatePool();
        harvestAdy();
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount.div(1e18));
            poolToken.approve(address(msg.sender), _amount);
            poolToken.transfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(accAdyPerShare).div(1e12);
        emit Withdraw(msg.sender, _amount);
    }

    function harvestAdy() public {
        updatePool();
        _harvestAdy();
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {
        return _to.sub(_from).mul(BONUS_MULTIPLIER);
    }

    // View function to see pending ADYs on frontend.
    function pendingAdy(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 _accAdyPerShare = accAdyPerShare;
        uint256 lpSupply = poolToken.balanceOf(address(this));
        if (block.number > lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
            uint256 adyReward = multiplier.mul(adyPerBlock);
            _accAdyPerShare = accAdyPerShare.add(
                adyReward.mul(1e30).div(lpSupply)
            );
        }
        return user.amount.mul(_accAdyPerShare).div(1e12).sub(user.rewardDebt);
    }

    function _harvestAdy() internal {
        UserInfo storage user = userInfo[msg.sender];
        uint256 pending = user.amount.mul(accAdyPerShare).div(1e12).sub(
            user.rewardDebt
        );
        if (pending > 0) {
            _safeAdyTransfer(msg.sender, pending.mul(1e18));
            emit Harvest(msg.sender, pending.mul(1e18));
        }
        user.rewardDebt = user.amount.mul(accAdyPerShare).div(1e12);
        emit Harvest(address(0), user.rewardDebt);
    }

    // Safe cake transfer function, just in case if rounding error causes pool to not have enough ADYs.
    function _safeAdyTransfer(address _to, uint256 _amount) internal {
        IAuditoryToken(adyToken).approve(address(this), _amount);
        IAuditoryToken(adyToken).transfer(_to, _amount);
    }
}
