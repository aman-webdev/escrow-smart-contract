const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const convertToWei = require("../scripts/convertToWei");
const deploy = require("../scripts/deploy");

describe("Escrow", () => {
  let lawyer, payer, seller, contract;

  beforeEach(async () => {
    [lawyer, payer, seller] = await ethers.getSigners();
    contract = await deploy();
  });

  describe("Payer", () => {
    it("Should not send money to lawyer if the sender is not payer", async () => {
      const sellerConnected = await contract.connect(seller);
      await expect(
        sellerConnected.sendLawyer({ value: convertToWei(10) })
      ).to.be.revertedWith("Only allowed by purchaser");
      const balance = await contract.getBalance();
      assert.equal(balance.toString(), "0");
    });

    it("Should not send money if the amount is not equal to the required amount", async () => {
      const payerConnected = contract.connect(payer);
      await expect(payerConnected.sendLawyer({ value: convertToWei(9) })).to.be
        .reverted;
      const contractBalance = await contract.getBalance();
      assert.equal(contractBalance.toString(), 0);
    });

    it("Should send fund to the contract", async () => {
      const contractInitBalance = await contract.getBalance();
      const payerConnected = contract.connect(payer);
      await payerConnected.sendLawyer({ value: convertToWei(10) });
      const contractAfterBalance = await contract.getBalance();
      const isAmountByPurchaserSentToLawyer =
        await contract.isAmountByPurchaserSentToLawyer();
      assert(isAmountByPurchaserSentToLawyer);
      assert.equal(contractAfterBalance.toString(), convertToWei(10));
      assert.equal(contractInitBalance.toString(), "0");
    });
  });
  describe("Seller", () => {
    it("Should revert if the payer has not funded the contract", async () => {
      const sellerConnected = contract.connect(seller);
      await expect(sellerConnected.sendDocumentToLawyer()).to.be.revertedWith(
        "The purchaser has not sent the amoun to lawyer"
      );
      const isDocumentBySellerSentToLawyer =
        await contract.isDocumentBySellerSentToLawyer();
      assert(!isDocumentBySellerSentToLawyer);
    });

    it("Should revert if the document is not sent by sender", async () => {
      const payerConnected = contract.connect(payer);
      await expect(payerConnected.sendDocumentToLawyer()).to.be.revertedWith(
        "Can only be called by seller"
      );
      const isDocumentBySellerSentToLawyer =
        await contract.isDocumentBySellerSentToLawyer();
      assert(!isDocumentBySellerSentToLawyer);
    });

    it("Should send the document to the contract / lawyer", async () => {
      const payerConnected = contract.connect(payer);
      await payerConnected.sendLawyer({ value: convertToWei(10) });
      const isAmountByPurchaserSentToLawyer =
        await contract.isAmountByPurchaserSentToLawyer();
      const sellerConnected = contract.connect(seller);
      await sellerConnected.sendDocumentToLawyer();
      const isDocumentBySellerSentToLawyer =
        await contract.isDocumentBySellerSentToLawyer();

      assert(isAmountByPurchaserSentToLawyer);
      assert(isDocumentBySellerSentToLawyer);
    });
  });

  describe("Release Funds", async () => {
    it("Should send the funds and complete the contract", async () => {
      const payerConnected = contract.connect(payer);
      const sellerConnected = contract.connect(seller);
      const sellerInitBalance = await seller.provider.getBalance(
        seller.address
      );
      await payerConnected.sendLawyer({ value: convertToWei(10) });
      const isAmountByPurchaserSentToLawyer =
        await contract.isAmountByPurchaserSentToLawyer();

      const tx = await sellerConnected.sendDocumentToLawyer();
      const txResponse = await tx.wait(1);
      const { gasUsed, effectiveGasPrice } = txResponse;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const isDocumentBySellerSentToLawyer =
        await contract.isDocumentBySellerSentToLawyer();
      await contract.release();
      const sellerAfterBalance = await seller.provider.getBalance(
        seller.address
      );

      const isAmountByLawyerSentToSeller =
        await contract.isAmountByLawyerSentToSeller();
      const isDocumentByLawyerSentToPurchaser =
        await contract.isDocumentByLawyerSentToPurchaser();

      assert(isAmountByLawyerSentToSeller);
      assert(isDocumentBySellerSentToLawyer);
      assert(isAmountByPurchaserSentToLawyer);
      assert(isDocumentByLawyerSentToPurchaser);
    });
  });
});
