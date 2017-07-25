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
        if (stage == Stages.closed && now > closingTime + closingTimeLimit * 1 days) {
            stage = Stages.finished;
        }
        if (stage == Stages.inArbitration && now > arbitrationTime + arbitrationTimeLimit * 1 days) {
            stage = Stages.finished;
        }
        _;
    }

    function nextStage() internal {
        stage = Stages(uint(stage) + 1);
    }

}
