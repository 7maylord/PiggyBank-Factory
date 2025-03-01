import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import  { ethers } from "hardhat";

describe("PiggyBankFactoryContract", function () {
  async function deployPiggyBankFixture() {
    const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

    const [owner, addr1, addr2] = await ethers.getSigners();

    const TokenA = await ethers.getContractFactory("ERCToken");
    const tokenA = await TokenA.deploy("MyTokenA", "MTA", 100000);
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();

    const TokenB = await ethers.getContractFactory("ERCToken");
    const tokenB = await TokenB.deploy("MyTokenB", "MTB", 100000);
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();

    const TokenC = await ethers.getContractFactory("ERCToken");
    const tokenC = await TokenC.deploy("MyTokenC", "MTC", 100000);
    await tokenC.waitForDeployment();
    const tokenCAddress = await tokenC.getAddress();

    const piggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");

    const deployPiggyBank = await piggyBankFactory.deploy();
    await deployPiggyBank.waitForDeployment();
    const FactoryAddress = await deployPiggyBank.getAddress();

    let allowedTokens = [ tokenAAddress, tokenBAddress, tokenCAddress ]; 
    const lockPeriod = 86400; // 1 Day in seconds
    const savingsPurpose = "Test Savings";

    const piggyBank = await ethers.getContractFactory("PiggyBank");
    const deployPiggy = await piggyBank.deploy(owner.address, FactoryAddress, allowedTokens, lockPeriod, savingsPurpose);
    await deployPiggy.waitForDeployment();
    const piggyAddress = await deployPiggy.getAddress();

    const piggyOwner = await deployPiggy.owner();


    console.log("PiggyBank Address:", piggyAddress);
    console.log("Factory Address:", FactoryAddress);
    console.log("Piggy Deployer Address:", owner.address);
    console.log("Piggy Owner Address:", piggyOwner);
   
   

    return { deployPiggyBank, FactoryAddress, piggyAddress, tokenA, tokenB, tokenC, owner, addr1, addr2,tokenAAddress, tokenBAddress, tokenCAddress, ADDRESS_ZERO, allowedTokens, lockPeriod, savingsPurpose };
  }

  describe("Deployment", function () {
    it("Should deploy ERC20 token A, B, C and assign the total supply to the owner", async function () {
          const { tokenA, tokenB, tokenC, owner } = await loadFixture(deployPiggyBankFixture);
          const ownerBalanceA = await tokenA.balanceOf(owner.address);
          expect(ownerBalanceA).to.equal(ethers.parseUnits("100000", 18));
          const ownerBalanceB = await tokenB.balanceOf(owner.address);
          expect(ownerBalanceB).to.equal(ethers.parseUnits("100000", 18));
          const ownerBalanceC = await tokenC.balanceOf(owner.address);
          expect(ownerBalanceC).to.equal(ethers.parseUnits("100000", 18));
      });

    it('should be deployed by owner', async() => {
        let { deployPiggyBank, owner } = await loadFixture(deployPiggyBankFixture);

        const runner = deployPiggyBank.runner as HardhatEthersSigner;

        expect(runner.address).to.equal(owner.address);
      });
    
    it('should not be address zero', async() => {
      let { deployPiggyBank, ADDRESS_ZERO } = await loadFixture(deployPiggyBankFixture);

      expect(deployPiggyBank.target).to.not.be.equal(ADDRESS_ZERO);
      });  
  });

  describe("computeAddress", function () {
    it("should compute the correct address for a PiggyBank contract", async function () {
        const { deployPiggyBank, addr1, lockPeriod, savingsPurpose, tokenAAddress, tokenBAddress, tokenCAddress } = await loadFixture(deployPiggyBankFixture);

        let allowedTokens = [ tokenAAddress, tokenBAddress, tokenCAddress ];

        // Calculate the salt for the computeAddress function
        const salt = await deployPiggyBank.createSalt(addr1.address, savingsPurpose);

        // Compute the address using the computeAddress function
        const computedAddress = await deployPiggyBank.computeAddress(
            addr1.address,
            allowedTokens,
            lockPeriod,
            savingsPurpose,
            salt
        );

        // Now, deploy the PiggyBank contract using createPiggyBank
        await deployPiggyBank.connect(addr1).createPiggyBank(allowedTokens, lockPeriod, savingsPurpose);

        // Retrieve the last deployed PiggyBank's contract address
        const piggyBanks = await deployPiggyBank.getAllPiggyBanks();

        const lastPiggyBank = piggyBanks[0];

        // Assert that the computed address matches the actual deployed contract address
        expect(computedAddress).to.equal(lastPiggyBank._contractAddress);
    });
  });

  describe("createPiggyBank", function () {
      it("should revert if allowedTokens length is not 3", async function () {

        const { deployPiggyBank, addr1, lockPeriod, savingsPurpose, tokenAAddress, tokenBAddress } = await loadFixture(deployPiggyBankFixture);

        let allowedTokens = [ tokenAAddress, tokenBAddress ];
        // Calculate the salt for the computeAddress function
        const salt = await deployPiggyBank.createSalt(addr1.address, savingsPurpose);

        // Compute the address using the computeAddress function
        await expect(deployPiggyBank.computeAddress(
            addr1.address,
            allowedTokens,
            lockPeriod,
            savingsPurpose,
            salt
        )).to.be.revertedWithCustomError(deployPiggyBank, "InvalidArguments");
      });

      it("should create a new PiggyBank contract and store its info", async function () {
        const { deployPiggyBank, addr1, lockPeriod, savingsPurpose, tokenAAddress, tokenBAddress, tokenCAddress } = await loadFixture(deployPiggyBankFixture);
    
        let allowedTokens = [ tokenAAddress, tokenBAddress, tokenCAddress ];
    
        await deployPiggyBank.connect(addr1).createPiggyBank(allowedTokens, lockPeriod, savingsPurpose);        
    
        // Retrieve the last deployed PiggyBank's contract address
        const piggyBanks = await deployPiggyBank.getAllPiggyBanks();

        const lastPiggyBank = piggyBanks[0];

        expect(await lastPiggyBank._savingsPurpose).to.equal(savingsPurpose);
        expect(await lastPiggyBank._lockTime).to.be.greaterThan(0);
      });
  
  
  
  



   });
});

