const hre = require("hardhat");
const { ethers, deployments } = hre;

async function approve() {
  const deployer = (await hre.getNamedAccounts()).deployer;
  const deployment = await deployments.get("Insurance");
  const accounts = await ethers.getSigners();
  const doctor = accounts[1];

  const doctorInsurance = await ethers.getContractAt(
    "Insurance", // contract name (must match compiled artifact)
    deployment.address, // deployed address
    doctor // connect with buyer signer directly
  );

  const tx = await doctorInsurance.approveClaim(2);
  await tx.wait(1);

  console.log(`Claim approved by ${accounts[1].address} claimId = 2`);
}

approve()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
