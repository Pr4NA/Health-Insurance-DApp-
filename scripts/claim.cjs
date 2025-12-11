// scripts/claim.cjs
const hre = require("hardhat");
const { ethers, deployments } = hre;

async function main() {
  const deployment = await deployments.get("Insurance");
  const accounts = await ethers.getSigners();
  const claimant = accounts[5];
  const doctor = accounts[1];

  const insurance = await ethers.getContractAt(
    "Insurance",
    deployment.address,
    claimant
  );

  let previewId;
  try {
    previewId = await insurance.callStatic.submitClaim(
      doctor.address,
      ethers.parseEther("0.01")
    );
    console.log("Preview claimId (callStatic):", previewId.toString());
  } catch (err) {
    console.log(
      "callStatic.submitClaim failed (likely policy not active or revert):",
      err.message
    );
    // continue to try the real tx to get clear revert if any
  }

  let tx;
  try {
    tx = await insurance.submitClaim(doctor.address, ethers.parseEther("0.01"));
  } catch (err) {
    console.error("submitClaim reverted:", err.message);
    return;
  }

  const receipt = await tx.wait(1);

  const parsed = receipt.logs
    .map((log) => {
      try {
        return insurance.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .filter((p) => p && p.name === "ClaimSubmitted")[0];

  if (parsed) {
    const claimId = parsed.args.id;
    console.log(`ClaimSubmitted event found. claimId = ${claimId.toString()}`);
    return;
  }

  console.log("receipt.events:", receipt.events);

  // Show raw logs (topics & data)
  receipt.logs.forEach((l, i) => {
    console.log(
      `log[${i}]: address=${l.address} topics=${JSON.stringify(
        l.topics
      )} data=${l.data}`
    );
  });

  if (previewId !== undefined) {
    console.log("Preview claimId (from callStatic):", previewId.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
