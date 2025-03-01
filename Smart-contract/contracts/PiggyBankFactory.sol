// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBankFactory is Ownable {
    struct PiggyBankInfo {
        address _contractAddress;
        uint256 _lockTime;
        string _savingsPurpose;
    }

    PiggyBankInfo[] private piggyBanks;
    
    // Mapping to track user's PiggyBanks
    mapping(address => PiggyBankInfo[]) public userPiggyBanks;

    event PiggyBankCreated(address indexed piggyBank, address indexed owner, string savingsPurpose, uint256 lockTime);    
    event PenaltyWithdrawn(address indexed _token, uint256 balance);

    error InvalidArguments();
    error InsufficientBalance();
    error InvalidNoOfTokens();

    constructor() Ownable(msg.sender) {}

    //Compute the address of a PiggyBank before deploying it
    function computeAddress( address _owner, address[] memory 
    _allowedTokens, uint256 lockPeriod, string memory savingsPurpose, bytes32 salt
    ) public view returns (address) { 

        if(_owner == address(0) || _allowedTokens.length != 3) revert InvalidArguments();

        bytes32 bytecodeHash = keccak256( abi.encodePacked( type(PiggyBank).creationCode, abi.encode(_owner, address(this), _allowedTokens, lockPeriod, savingsPurpose)));


        return address(uint160(uint256(keccak256(abi.encodePacked( bytes1(0xff), address(this), salt, bytecodeHash )))));
    }

    //Create salt Sample
    function createSalt(address _owner, string memory savingsPurpose) public pure returns (bytes32) {

        bytes32 salt = keccak256(abi.encodePacked(_owner, savingsPurpose));

        return salt;
    }


    function createPiggyBank( address[] memory allowedTokens, uint256 lockPeriod, string memory savingsPurpose) external {

        if(allowedTokens.length != 3) revert InvalidNoOfTokens();

        bytes32 salt = keccak256(abi.encodePacked(msg.sender, savingsPurpose));

        PiggyBank newPiggyBank = new PiggyBank{ salt: salt }(msg.sender, address(this), allowedTokens, lockPeriod, savingsPurpose);

        uint256 lockTime = block.timestamp + lockPeriod;

        PiggyBankInfo memory _newInfo = PiggyBankInfo({
            _contractAddress: address(newPiggyBank),            
            _lockTime: lockTime,
            _savingsPurpose: savingsPurpose
        });


        piggyBanks.push(_newInfo); // Add new piggy bank to global array
        userPiggyBanks[msg.sender].push(_newInfo); // Add new piggy bank to user's array

        emit PiggyBankCreated(address(newPiggyBank), msg.sender, savingsPurpose, lockTime);
    }


    //Factory owner can withdraw collected penalties
    function withdrawPenalties(address _token) external onlyOwner {

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));

        if(balance == 0) revert InsufficientBalance();

        token.transfer(owner(), balance);

        emit PenaltyWithdrawn(_token, balance);
    }

    //Get all PiggyBanks deployed by a specific user
    function getUserPiggyBanks(address user) external view returns (PiggyBankInfo[] memory) {
        return userPiggyBanks[user];
    }

    //Get all PiggyBanks deployed by all users
    function getAllPiggyBanks() external view onlyOwner returns (PiggyBankInfo[] memory) {
        return piggyBanks;
    }
}
