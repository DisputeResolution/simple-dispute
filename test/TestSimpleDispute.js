const SimpleDispute = artifacts.require("SimpleDispute");
const testUtils = require('../utils/test-helpers.js');

contract("SimpleDispute", function(accounts) {
    const configClosingTime = 2;
    const configArbitrationTime = 2;
    const configExpectedCollateral = 2;
    const arbitratorAddress = web3.eth.accounts[0];
    const partyAddresses = [web3.eth.accounts[1], web3.eth.accounts[2]];

    it("should set up a contract as expected", function() {
        let dispute;
        const secondsInDay = 86400;
        return SimpleDispute.new(configClosingTime, configArbitrationTime, configExpectedCollateral,
            arbitratorAddress, partyAddresses).then(function(instance) {
                dispute = instance;
                return dispute.expectedCollateral();
        }).then(function(res) {
            assert(Number(res) / 10e17 === configExpectedCollateral, 'Constructor collateral config and contract expected collateral should be equal.');
            return dispute.closingTimeLimit();
        }).then(function(res) {
            assert(Number(res) / secondsInDay === configArbitrationTime, 'Constructor closing time limit and contract closing time limit should be equal.');
            return dispute.arbitrationTimeLimit();
        }).then(function(res) {
            assert(Number(res) / secondsInDay === configArbitrationTime, 'Constructor arbitration time limit and contract arbitration time limit should be equal.');
            return dispute.arbitrator();
        }).then(function(res) {
            assert(arbitratorAddress === res[0], 'Constructor arbitrator and contract arbitrator should be the same.');
            for (let i = 0; i < partyAddresses.length; i++) {
                (function() {
                    return dispute.parties.call(i)
                })().then(function(res) {
                        assert.equal(res[0], partyAddresses[i], `Address number ${i} in test partyAddresses should be the same as the deployed contract.`);
                    });
            };
        });
    });
});
