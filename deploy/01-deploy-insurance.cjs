const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { verify } = require("../utils/verify.cjs");

module.exports = async () => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const accounts = await ethers.getSigners();

  const args = [
    ethers.parseEther("0.005"),
    ethers.parseEther("0.02"),
    [accounts[1].address, accounts[2].address, accounts[3].address],
  ];

  const insurance = await deploy("Insurance", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: 1,
  });

  log(`COntract deployed at: ${insurance.address}`);

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    log("verifying...");
    await verify(insurance.address, args);
  }

  log("------Done deploying-------");
};

module.exports.tags = ["all", "insurance"];
