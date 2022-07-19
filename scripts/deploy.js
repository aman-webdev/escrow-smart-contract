const { ethers } = require("hardhat");
const convertToWei = require("./convertToWei");
const deploy = async () => {
  const [lawyer, payer, seller] = await ethers.getSigners();
  const contractFactory = await ethers.getContractFactory("Escrow");

  const contract = await contractFactory.deploy(
    payer.address,
    seller.address,
    convertToWei(10)
  );

  return contract;
};

deploy();

module.exports = deploy;
