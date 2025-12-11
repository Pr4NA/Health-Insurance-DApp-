const hre = require("hardhat");
const { ethers, deployments } = hre;

async function withdrawal() {
  const deployer = (await hre.getNamedAccounts()).deployer;
  const deployment = await deployments.get("Insurance");
  const accounts = await ethers.getSigners();
  const owner = accounts[0];

  const ownerInsurance = await ethers.getContractAt(
    "Insurance", // contract name (must match compiled artifact)
    deployment.address, // deployed address
    owner // connect with buyer signer directly
  );

  const tx = await ownerInsurance.withdraw(ethers.parseEther("0.001"));
  await tx.wait(1);

  console.log(`Successfully withdrawn 0.001 ethers.`);
  console.log(
    `Remaining balance = ${await ethers.provider.getBalance(
      deployment.address
    )}`
  );
}

withdrawal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
