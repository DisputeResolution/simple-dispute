pragma solidity ^0.4.11;

contract SimpleDispute {

    struct Party {
        address id;
        uint collateral;
    }

    // Contract parties
    Party public arbitrator;
    Party public partyA;
    Party public partyB;

    // Stage Timers
    uint public closingTime;
    uint public arbitrationTime;

    // State management logic
    enum Stages {
        inactive,
        active,
        closed,
        inArbitration,
        finished
    }


    Stages public stage = Stages.inactive;

    modifier atStage(Stages _stage) {
        require(stage == _stage);
        _;
    }

    modifier transitionNext() {
        _;
        nextStage();
    }

    modifier timedTrasitions() {
        if (stage == Stages.closed && now > closingTime + 2 days) {
            stage = Stages.finished;
        }
        if (stage == Stages.inArbitration && now > arbitrationTime + 2 days) {
            stage = Stages.finished;
        }
        _;
    }

    function nextStage() internal {
        stage = Stages(uint(stage) + 1);
    }

    // Modifier to restrict access to different users
    modifier onlyArbitrator() {
        require(msg.sender == arbitrator.id);
        _;
    }

    modifier onlyParty {
        require(msg.sender == partyA.id && msg.sender == partyB.id);
        _;
    }

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
