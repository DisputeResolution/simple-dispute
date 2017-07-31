pragma solidity ^0.4.11;

contract StateMachine {

    // Contract stage timers
    uint public closingTime;
    uint public arbitrationTime;

    // Configurable stage timers
    uint public closingTimeLimit;
    uint public arbitrationTimeLimit;

    // State management logic
    enum Stages {
        inactive,
        active,
        closed,
        inArbitration,
        paying,
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
        if (stage == Stages.closed && now > closingTime + closingTimeLimit) {
            stage = Stages.paying;
        }
        if (stage == Stages.inArbitration && now > arbitrationTime + arbitrationTimeLimit) {
            stage = Stages.paying;
        }
        _;
    }

    function nextStage() internal {
        stage = Stages(uint(stage) + 1);
    }

}
