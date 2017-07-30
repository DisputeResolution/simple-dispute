const SimpleDispute = artifacts.require("SimpleDispute");
const increaseTime = require('../utils/increaseTime');
const expectThrow = require('../utils/expectThrow');

contract("SimpleDispute", function(accounts) {
    let dispute;
    const configClosingTime = 2;
    const configArbitrationTime = 2;
    const configExpectedCollateral = 1;
    const arbitratorAddress = accounts[0];
    const partyAddresses = [accounts[1], accounts[2]];
    const unauthorizedAddress = accounts[3];
    const amount = web3.toWei(1, 'ether');
    const secondsInDay = 86400;

    beforeEach(async () => {
         dispute = await SimpleDispute.new(configClosingTime, configArbitrationTime,
                                           configExpectedCollateral, arbitratorAddress, partyAddresses);
         await dispute.depositCollateral({from: arbitratorAddress, value: amount});
         await dispute.depositCollateral({from: partyAddresses[0], value: amount});
         await dispute.depositCollateral({from: partyAddresses[1], value: amount});
    });

    it("should set up a contract as expected", async function() {
        assert(await dispute.expectedCollateral() / 10e17 === configExpectedCollateral, 'Deployed contract and constructor expected collateral should be equal.');
        assert(await dispute.closingTimeLimit() / secondsInDay === configArbitrationTime, 'Deployed contract and constructor closing time limit should be equal.');
        assert(await dispute.arbitrationTimeLimit() / secondsInDay === configArbitrationTime, 'Deployed contract and constructor arbitration time limit should be equal.');

        let arbitrator = await dispute.arbitrator()
        assert(arbitrator[0] === arbitratorAddress, 'Deployed contract and constructor arbitrator should be equal.');

        for (let i = 0; i < partyAddresses.length; i++) {
            let party = await dispute.parties(i)
            assert.equal(party[0], partyAddresses[i], `Deployed contract and constructor party ${i} should be equal.`);
        };
    });
});
