// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract Escrow {
    address  immutable public i_lawyer;
    address immutable public i_purchaser;
    address payable immutable public i_seller;
    uint public immutable i_amount;
    bool public isAmountByPurchaserSentToLawyer;
    bool public isAmountByLawyerSentToSeller;
    bool public isDocumentBySellerSentToLawyer;
    bool public isDocumentByLawyerSentToPurchaser;

    constructor(address purchaser,address payable seller,uint amount) {
        i_lawyer = msg.sender;
        i_purchaser = purchaser;
        i_seller = seller;
        i_amount = amount;
    }

    function sendLawyer() payable external   {
            require(msg.sender==i_purchaser,"Only allowed by purchaser");
            require(msg.value==i_amount,"The value sent is not equal to amount asked by Seller");
            isAmountByPurchaserSentToLawyer=true;

    }


    function sendDocumentToLawyer() external {
        require(msg.sender==i_seller,"Can only be called by seller");
        require(isAmountByPurchaserSentToLawyer==true,"The purchaser has not sent the amoun to lawyer");
        isDocumentBySellerSentToLawyer=true;

    }

    function release() external {
        require(address(this).balance==i_amount,"The amount should be equal");
        require(msg.sender==i_lawyer,"Can only be called by lawyer");
        require(isAmountByPurchaserSentToLawyer,"The purchaser has not sent amoun to lawyer");
        require(isDocumentBySellerSentToLawyer,"The seller has not sent the doucment to lawyer");
        i_seller.transfer(i_amount);
        isAmountByLawyerSentToSeller=true;
        isDocumentByLawyerSentToPurchaser=true;


    }

    function getBalance() public view returns(uint256){
        return address(this).balance;
    }


}