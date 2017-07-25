pragma solidity ^0.4.11;

contract AccessControl {

// Modifier to restrict access to different users
modifier onlyArbitrator() {
    require(msg.sender == arbitrator.id);
    _;
}

modifier onlyParty {
    require(msg.sender == partyA.id && msg.sender == partyB.id);
    _;
}
