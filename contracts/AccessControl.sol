pragma solidity ^0.4.11;

contract AccessControl {

// Modifier to restrict access to different users
modifier onlyArbitrator() {
    require(msg.sender == arbitrator.id);
    _;
}

modifier onlyParty {
    require(msg.sender == partyA.id && msg.sender == partyB.id);
    bool foundID = false;
    for (uint i = 0; i < parties.length; i++) {
        if (parties[i].id == msg.sender) {
            foundID = true;
            break
        }
    }
    require(foundID == true);
    _;
}
