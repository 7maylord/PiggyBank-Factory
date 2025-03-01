import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import  { ethers } from "hardhat";

async function deployPiggyBankFixture() {
    const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

    const [owner, addr1, addr2] = await ethers.getSigners();

    const TokenA = await ethers.getContractFactory("ERCToken");
    const tokenA = await TokenA.deploy("MyTokenA", "MTA", 100000);
    await tokenA.waitForDeployment();

    const TokenB = await ethers.getContractFactory("ERCToken");
    const tokenB = await TokenB.deploy("MyTokenB", "MTB", 100000);
    await tokenB.waitForDeployment();

    const TokenC = await ethers.getContractFactory("ERCToken");
    const tokenC = await TokenC.deploy("MyTokenC", "MTC", 100000);
    await tokenC.waitForDeployment();

    const piggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");

    const deployPiggyBank = await piggyBankFactory.deploy();
    await deployPiggyBank.waitForDeployment();


    return { deployPiggyBank, tokenA, tokenB, tokenC, owner, addr1, addr2, ADDRESS_ZERO };
}

  describe("Deployment", function () {
      it("Should deploy token A, B, C and assign the total supply to the owner", async function () {
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
// describe("Lock", function () {
//   // We define a fixture to reuse the same setup in every test.
//   // We use loadFixture to run this setup once, snapshot that state,
//   // and reset Hardhat Network to that snapshot in every test.
//   async function deployOneYearLockFixture() {
//     const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
//     const ONE_GWEI = 1_000_000_000;

//     const lockedAmount = ONE_GWEI;
//     const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

//     // Contracts are deployed using the first signer/account by default
//     const [owner, otherAccount] = await hre.ethers.getSigners();

//     const Lock = await hre.ethers.getContractFactory("Lock");
//     const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

//     return { lock, unlockTime, lockedAmount, owner, otherAccount };
//   }

//   describe("Deployment", function () {
//     it("Should set the right unlockTime", async function () {
//       const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

//       expect(await lock.unlockTime()).to.equal(unlockTime);
//     });

//     it("Should set the right owner", async function () {
//       const { lock, owner } = await loadFixture(deployOneYearLockFixture);

//       expect(await lock.owner()).to.equal(owner.address);
//     });

//     it("Should receive and store the funds to lock", async function () {
//       const { lock, lockedAmount } = await loadFixture(
//         deployOneYearLockFixture
//       );

//       expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
//         lockedAmount
//       );
//     });

//     it("Should fail if the unlockTime is not in the future", async function () {
//       // We don't use the fixture here because we want a different deployment
//       const latestTime = await time.latest();
//       const Lock = await hre.ethers.getContractFactory("Lock");
//       await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
//         "Unlock time should be in the future"
//       );
//     });
//   });

//   describe("Withdrawals", function () {
//     describe("Validations", function () {
//       it("Should revert with the right error if called too soon", async function () {
//         const { lock } = await loadFixture(deployOneYearLockFixture);

//         await expect(lock.withdraw()).to.be.revertedWith(
//           "You can't withdraw yet"
//         );
//       });

//       it("Should revert with the right error if called from another account", async function () {
//         const { lock, unlockTime, otherAccount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // We can increase the time in Hardhat Network
//         await time.increaseTo(unlockTime);

//         // We use lock.connect() to send a transaction from another account
//         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
//           "You aren't the owner"
//         );
//       });

//       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
//         const { lock, unlockTime } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // Transactions are sent using the first signer by default
//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).not.to.be.reverted;
//       });
//     });

//     describe("Events", function () {
//       it("Should emit an event on withdrawals", async function () {
//         const { lock, unlockTime, lockedAmount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw())
//           .to.emit(lock, "Withdrawal")
//           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
//       });
//     });

//     describe("Transfers", function () {
//       it("Should transfer the funds to the owner", async function () {
//         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).to.changeEtherBalances(
//           [owner, lock],
//           [lockedAmount, -lockedAmount]
//         );
//       });
//     });
//   });
// });
