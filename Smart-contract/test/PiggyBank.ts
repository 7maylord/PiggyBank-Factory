import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import  { ethers } from "hardhat";

describe("PiggyBankContract", function () {
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

  describe("Deposit", function () {
    // describe("Saving tokens", function () {
    //     it("should allow contributors to deposit tokens", async function () {
    //         const { deployPiggyBank, tokenA, addr1 } = await loadFixture(deployPiggyBankFixture);
    //         const depositAmount = hre.ethers.parseUnits("50", 18);

    //         await token.connect(contributor1).approve(piggyBank.target, depositAmount);
    //         await expect(piggyBank.connect(contributor1).save(depositAmount))
    //             .to.emit(piggyBank, "Contributed")

    //         expect(await piggyBank.contributions(contributor1.address)).to.equal(depositAmount);
    //     });
    // });
    });
});