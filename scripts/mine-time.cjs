const { network } = require("hardhat");

async function mineTime() {
  if (network.config.chainId !== 31337) {
    console.log("Not a local network");
    return;
  }

  console.log("Moving time forward by 29 days...");

  const seconds = 29 * 24 * 60 * 60;

  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");

  console.log("Time moved successfully by 29 days!");
}

mineTime()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
