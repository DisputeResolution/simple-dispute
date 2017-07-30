pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/payment/PullPayment.sol';
import './StateMachine.sol';
import './AccessControl.sol';

contract SimpleDispute is StateMachine, AccessControl, PullPayment {
    uint public expectedCollateral;
    address public disputingAddress;
    bool public arbitrationOccurred;
    bool public disputeResolved;

    event LogActivation(bool activated, Stages stage);
    event LogDebug(address from, uint amount);
    event LogDeposit(address indexed from, bool deposited);

    function SimpleDispute(
        uint configClosingTime,
        uint configArbitrationTime,
        uint configExpectedCollateral,
        address arbitratorAddress,
        address[] partyAddresses)
    {
        closingTimeLimit = configClosingTime * 1 days;
        arbitrationTimeLimit = configArbitrationTime * 1 days;
        expectedCollateral = configExpectedCollateral * 1 ether;
        arbitrator = Party({ id: arbitratorAddress, hasCollateral: false });
        for (uint i = 0; i < partyAddresses.length; i++) {
            parties.push(Party({ id: partyAddresses[i], hasCollateral: false }));
        }
    }

    function depositCollateral() payable atStage(Stages.inactive) {
        require(msg.value == expectedCollateral);
        for (uint i = 0; i < parties.length; i++) {
            if (parties[i].id == msg.sender) {
                parties[i].hasCollateral = true;
            }
        }
        if (arbitrator.id == msg.sender) {
            arbitrator.hasCollateral = true;
        }
    }

    function activateContract() onlyParty atStage(Stages.inactive) {
        for (uint i = 0; i < parties.length; i++) {
            require(parties[i].hasCollateral == true);
        }
        require(arbitrator.hasCollateral == true);
        nextStage();
        LogActivation(true, stage);
    }

    function closeContract() onlyParty atStage(Stages.active) {
        closingTime = now;
        nextStage();
    }

    function callArbitration() onlyParty atStage(Stages.closed) {
        require(now <= closingTime + closingTimeLimit);
        disputingAddress = msg.sender;
        arbitrationOccurred = true;
        disputeResolved = false;
        arbitrationTime = now;
        nextStage();
    }

    function awardParty (address winning_party)
        onlyArbitrator
        timedTrasitions
        atStage(Stages.inArbitration)
    {
        uint amount = expectedCollateral * parties.length;
        asyncSend(winning_party, amount);
        asyncSend(arbitrator.id, expectedCollateral);
        disputeResolved = true;
        nextStage();
    }

    function claimArbitratorMoney()
        atStage(Stages.inArbitration)
        onlyParty
    {
        require(now > arbitrationTime + arbitrationTimeLimit);
        asyncSend(disputingAddress, expectedCollateral);
        nextStage();
    }

    function unlockCollateral()
        onlyParty
        timedTrasitions
        atStage(Stages.finished)
    {
        require(disputeResolved != true);
        for (uint i = 0; i < parties.length; i++) {
            asyncSend(parties[i].id, expectedCollateral);
        }
        if (arbitrationOccurred != true) {
            asyncSend(arbitrator.id, expectedCollateral);
        }
    }
}
