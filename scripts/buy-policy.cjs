// scripts/buy-policy.cjs
const hre = require("hardhat");
const { ethers, deployments } = hre;

async function buyPolicy() {
  const deployer = (await hre.getNamedAccounts()).deployer;
  const deployment = await deployments.get("Insurance");
  const accounts = await ethers.getSigners();
  const buyer = accounts[5];

  const insurance = await ethers.getContractAt(
    "Insurance", // contract name (must match compiled artifact)
    deployment.address, // deployed address
    buyer // connect with buyer signer directly
  );

  const tx = await insurance.buyPolicy({
    value: ethers.parseEther("0.02"),
  });
  await tx.wait(1);

  console.log(`Policy bought by ${buyer.address}`);
}

buyPolicy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
