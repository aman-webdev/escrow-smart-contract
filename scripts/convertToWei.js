const { ethers } = require("hardhat");
module.exports = (value) => ethers.utils.parseEther(value.toString());
