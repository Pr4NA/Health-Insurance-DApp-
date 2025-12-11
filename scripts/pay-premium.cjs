const hre = require("hardhat");
const { ethers, deployments } = hre;

async function payPremium() {
  const deployer = (await hre.getNamedAccounts()).deployer;
  const deployment = await deployments.get("Insurance");
  const accounts = await ethers.getSigners();
  const buyer = accounts[5];

  const userInsurance = await ethers.getContractAt(
    "Insurance", // contract name (must match compiled artifact)
    deployment.address, // deployed address
    buyer // connect with buyer signer directly
  );

  const tx = await userInsurance.payPremium({
    value: ethers.parseEther("0.005"),
  });
  await tx.wait(1);

  console.log(`Prmeium paid by ${accounts[5].address}`);
}

payPremium()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
