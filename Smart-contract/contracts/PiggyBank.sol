// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBank is Ownable {

    address[] public allowedTokens;
    address public factoryOwner;
    uint8 public constant PENALTY_PERCENTAGE = 15;
    uint256 public lockTime;
    string public savingsPurpose;

    mapping(address => bool) public isAllowedToken; //Token address => allowed
    mapping(address => uint256) public balances; //Token address => balance

    

    event Deposit(address indexed token, address indexed sender, uint256 amount);
    event Withdrawal(address indexed token, address indexed recipient, uint256 amount);
    event EmergencyWithdrawal(address indexed token, address indexed recipient, uint256 amount, uint256 penalty);
    event LockTimeSet(uint256 unlockTime);

    error InvalidConstructorArguments();
    error InvalidToken();
    error InsufficientBalance();
    error NotYetUnlockTime();
    error TransferFailed(address token, address recipient, uint256 amount);
    
    constructor(address _owner, address _factoryOwner, address[] memory _allowedTokens, uint256 _lockPeriod,string memory _savingsPurpose) Ownable(_owner) {
        if(_owner == address(0) || _factoryOwner == address(0) || _allowedTokens.length != 3) revert InvalidConstructorArguments();
        factoryOwner = _factoryOwner;
        savingsPurpose = _savingsPurpose;
        lockTime = block.timestamp + _lockPeriod;

        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            require(_allowedTokens[i] != address(0), "Invalid token address");
            allowedTokens.push(_allowedTokens[i]);
            isAllowedToken[_allowedTokens[i]] = true;
        }

        emit LockTimeSet(lockTime);
    }


    function deposit(address token, uint256 amount) external {
        if(!isAllowedToken[token]) revert InvalidToken();
        IERC20 erc20 = IERC20(token);

        require(erc20.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        balances[token] += amount;
        emit Deposit(token, msg.sender, amount);
    }

    function withdraw(address token, uint256 amount) external onlyOwner {
        if(!isAllowedToken[token]) revert InvalidToken();
        if(block.timestamp < lockTime) revert NotYetUnlockTime();
        if(balances[token] < amount) revert InsufficientBalance();

        balances[token] -= amount;

        // Ensure successful withdrawal transfer
        if (!IERC20(token).transfer(msg.sender, amount)) revert TransferFailed(token, msg.sender, amount);
        //require(IERC20(token).transfer(msg.sender, amount), "Withdrawal failed");

        emit Withdrawal(token, msg.sender, amount);
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner() {
        if(!isAllowedToken[token]) revert InvalidToken();
        if(balances[token] < amount) revert InsufficientBalance();

        uint256 penalty = (amount * PENALTY_PERCENTAGE) / 100;
        uint256 withdrawAmount = amount - penalty;

        balances[token] -= amount;
        
        // require(IERC20(token).transfer(factoryOwner, penalty), "Penalty transfer failed");
        // require(IERC20(token).transfer(msg.sender, withdrawAmount), "Withdrawal failed");
        // Ensure successful penalty transfer
        if (!IERC20(token).transfer(factoryOwner, penalty)) revert TransferFailed(token, factoryOwner, penalty);

        // Ensure successful withdrawal transfer
        if (!IERC20(token).transfer(msg.sender, withdrawAmount)) revert TransferFailed(token, msg.sender, withdrawAmount);

        emit EmergencyWithdrawal(token, msg.sender, withdrawAmount, penalty);
    }

    function getBalance(address token) external view returns (uint256) {
        return balances[token];
    }

    function getAllowedTokens() external view returns (address[] memory) {
        return allowedTokens;
    }

    function timeUntilUnlock() external view returns (uint256) {
        if (block.timestamp >= lockTime) {
            return 0;
        }
        return lockTime - block.timestamp;
    }
}
