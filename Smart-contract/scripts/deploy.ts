import { ethers, run, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // Deploy PiggyBankFactory contract
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");

    console.log("Deploying PiggyBankFactory contract...");

    const piggyBankFactory = await PiggyBankFactory.deploy();
    await piggyBankFactory.waitForDeployment();
    const piggyBankFactoryAddress = await piggyBankFactory.getAddress();
    console.log(`PiggyBank Factory deployed at: ${piggyBankFactoryAddress}`);


    // Wait for a few confirmations before verification
    if (network.name !== "hardhat") {
        console.log("Waiting for transactions to confirm...");
        await new Promise((resolve) => setTimeout(resolve, 30000));

        try {
            console.log("Verifying PiggyBank Factory contract...");
            await run("verify:verify", {
                address: piggyBankFactoryAddress,
            });
            console.log("PiggyBank Factory verified successfully!");
        } catch (error) {
            console.error("Verification failed:", error);
        }

    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
