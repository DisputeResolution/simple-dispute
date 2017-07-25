pragma solidity ^0.4.11;

import './StateMachine.sol';
import './AccessControl.sol';

contract SimpleDispute is StateMachine, AccessControl {

    struct Party {
        address id;
        uint collateral;
    }

    function SimpleDispute(uint configClosingTime, uint configArbitrationTime) {
        closingTimeLimit = configClosingTime;
        arbitrationTimeLimit = configArbitrationTime;
    }

    // Contract parties
    Party public arbitrator;
    Party public partyA;
    Party public partyB;

    // Set up contract parties
    function setPartyA() payable {
        partyA = Party({id: msg.sender, collateral: msg.value});
    }

    function setPartyB() payable {
        partyB = Party({id: msg.sender, collateral: msg.value});
    }

    function setArbitrator() payable {
        arbitrator = Party({id: msg.sender, collateral: msg.value});
    }

    // Activate contract once all parties are present
    function activateContract() atStage(Stages.inactive) {
        require(partyA.id != 0 && partyB.id != 0 && arbitrator.id != 0);
        nextStage();
    }
    // Close contract
    function closeContract() atStage(Stages.active) onlyParty {
        nextStage();
        closingTime = now;
    }

    // Call arbitration if something went wrong with the contract.
    function callArbitration() onlyParty atStage(Stages.closed) {
        require(now <= closingTime + 2 days);
        nextStage();
        arbitrationTime = now;
    }

    // Super non DRY but temporary withdrawal functions.
    function withdrawalPartyA()
        timedTrasitions
        atStage(Stages.finished)
    {
        uint amount = partyA.collateral;
        partyA.collateral = 0;

        partyA.id.transfer(amount);

    }

    function withdrawalPartyB()
        timedTrasitions
        atStage(Stages.finished)
    {
        uint amount = partyB.collateral;
        partyB.collateral = 0;

        partyB.id.transfer(amount);

    }

    function withdrawalArbitrator()
        timedTrasitions
        atStage(Stages.finished)
    {
        uint amount = arbitrator.collateral;
        arbitrator.collateral = 0;

        arbitrator.id.transfer(amount);
    }

    function claimArbitratorMoney()
        atStage(Stages.inArbitration)
    {
        if (now > arbitrationTime + 2 days) {
            uint amount = arbitrator.collateral;

            arbitrator.collateral = 0;
            partyA.collateral += amount / 2;
            partyB.collateral += amount / 2;

            nextStage();
        }
    }

    function awardPartyA ()
        onlyArbitrator
        timedTrasitions
        atStage(Stages.inArbitration)
    {
        uint amount = partyB.collateral;
        partyB.collateral = 0;
        partyA.collateral += amount;
        nextStage();
    }

    function awardPartyB ()
        onlyArbitrator
        timedTrasitions
        atStage(Stages.inArbitration)
    {
        uint amount = partyA.collateral;
        partyA.collateral = 0;
        partyB.collateral += amount;
        nextStage();
    }
}
