pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/payment/PullPayment.sol';
import './StateMachine.sol';
import './AccessControl.sol';

contract SimpleDispute is StateMachine, AccessControl, PullPayment {

    // Contract structures
    struct Party {
        address id;
        bool hasCollateral;
    }

    uint public expectedCollateral;
    bool public disputeResolved = false;
    address public disputingAddress;
    // Contract parties
    Party public arbitrator;
    Party[] public parties;

    // Contract constructor
    function SimpleDispute(
        uint configClosingTime,
        uint configArbitrationTime,
        uint configExpectedCollateral,
        address arbitratorAddress,
        address[] partyAddresses)
    {
        closingTimeLimit = configClosingTime * 1 days;
        arbitrationTimeLimit = configArbitrationTime * 1 days;
        expectedCollateral = configExpectedCollateral;
        arbitrator = { id: arbitratorAddress, hasCollateral: false }
        for (uint i = 0, i < partyAddresses.length; i++) {
            parties.push({ id: partyAddresses[i], hasCollateral: false });
        }
    }

    function sendCollateral() payable {
        require(msg.value >= expectedCollateral);
        for (uint i = 0, i < parties.length; i++) {
            if (parties[i].id == msg.sender) {
                parties[i].hasCollateral = true;
                return;
            }
        }
        if (arbitrator.id == msg.sender) {
            arbitrator.hasCollateral = true;
        }
    }

    // Activate contract once all parties are present
    function activateContract() atStage(Stages.inactive) {
        // Check that all parties are present and have their collaterals.
        for (uint i = 0; i < parties.length; i++) {
            require(parties[i].hasCollateral == true);
        }
        // Check that the chosen arbitrator is present and has collateral.
        require(arbitrator.hasCollateral == true);
        // Move the contract to the next stage.
        nextStage();
    }

    // Close contract
    function closeContract() atStage(Stages.active) onlyParty {
        nextStage();
        closingTime = now;
    }

    // Call arbitration if something went wrong with the contract.
    function callArbitration() onlyParty atStage(Stages.closed) {
        require(now <= closingTime + closingTimeLimit);
        disputingAddress = msg.sender;
        arbitrationTime = now;
        nextStage();
    }

    function unlockCollateral() onlyParty atStage(Stages.finished){
        require(disputeResolved == false);
        for (uint i = 0; i < parties.length; i++) {
            asyncSend(aparties[i].id, expectedCollateral);
        }
        asyncSend(arbitrator.id, expectedCollateral);
    }

    function awardParty (address winning_party)
        onlyArbitrator
        timedTrasitions
        atStage(Stages.inArbitration)
    {
        uint amount = expectedCollateral * parties.length;
        asyncSend(winning_party, amount);
        partyA.collateral += amount;
        disputeResolved = true;
        nextStage();
    }


    function claimArbitratorMoney()
        atStage(Stages.inArbitration)
    {
        if (now > arbitrationTime + arbitrationTimeLimit) {
            asyncSend(disputingAddress, expectedCollateral);
            nextStage();
        }
    }
}
