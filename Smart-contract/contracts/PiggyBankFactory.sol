// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBankFactory is Ownable {
    struct PiggyBankInfo {
        address contractAddress;
        string savingsPurpose;
        uint256 lockTime;
    }

    PiggyBankInfo[] public piggyBanks;
    
    // Mapping to track user's PiggyBanks
    mapping(address => PiggyBankInfo[]) public userPiggyBanks;

    event PiggyBankCreated(address indexed piggyBank, address indexed owner, string savingsPurpose, uint256 lockTime);

    constructor() Ownable(msg.sender) {}

    // 🔹 Compute the address of a PiggyBank before deploying it
    function computeAddress(
        address owner,
        address[] memory allowedTokens,
        uint256 lockPeriod,
        string memory savingsPurpose,
        bytes32 salt
    ) public view returns (address) {
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(PiggyBank).creationCode,
                abi.encode(owner, owner(), allowedTokens, lockPeriod, savingsPurpose)
            )
        );
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            bytecodeHash
        )))));
    }

    function createPiggyBank(
        address[] memory allowedTokens,
        uint256 lockPeriod,
        string memory savingsPurpose
    ) external {
        require(allowedTokens.length == 3, "Must specify exactly 3 tokens");

        bytes32 salt = keccak256(abi.encodePacked(msg.sender, savingsPurpose, block.timestamp));

        PiggyBank newPiggyBank = new PiggyBank{
            salt: salt
        }(msg.sender, owner(), allowedTokens, lockPeriod, savingsPurpose);

        PiggyBankInfo memory newInfo = PiggyBankInfo({
            contractAddress: address(newPiggyBank),
            savingsPurpose: savingsPurpose,
            lockTime: block.timestamp + lockPeriod
        });

        piggyBanks.push(newInfo);
        userPiggyBanks[msg.sender].push(newInfo);

        emit PiggyBankCreated(address(newPiggyBank), msg.sender, savingsPurpose, block.timestamp + lockPeriod);
    }

    //Factory owner can withdraw collected penalties
    function withdrawPenalties() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    //Get all PiggyBanks deployed by a specific user
    function getUserPiggyBanks(address user) external view returns (PiggyBankInfo[] memory) {
        return userPiggyBanks[user];
    }

    //Get all PiggyBanks deployed by all users
    function getAllPiggyBanks() external view returns (PiggyBankInfo[] memory) {
        return piggyBanks;
    }
}
