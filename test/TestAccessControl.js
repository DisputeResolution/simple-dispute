const SimpleDispute = artifacts.require("SimpleDispute");
const testUtils = require('../utils/test-helpers.js');

contract("AccessControl", function(accounts) {
    const configClosingTime = 2;
    const configArbitrationTime = 2;
    const configExpectedCollateral = 2;
    const arbitratorAddress = web3.eth.accounts[0];
    const partyAddresses = [web3.eth.accounts[1], web3.eth.accounts[2]];
    const unauthorizedAddress = web3.eth.accounts[5];

    it("should only allow a party to activate the contract.", function() {
        let dispute;
        const amount = configExpectedCollateral;
        return SimpleDispute.new(configClosingTime, configArbitrationTime, configExpectedCollateral,
            arbitratorAddress, partyAddresses).then(function(instance) {
                dispute = instance;
                return dispute.depositCollateral({from: arbitratorAddress, value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[0], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[1], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.stage();
        }).then(function(res) {
            assert(String(res) == '0', 'Before activation the stage should be 0');
            return dispute.activateContract({from: unauthorizedAddress});
        }).then(function(res) {
            assert(false, "A non-party shouldn't be able to activate the contract");
        }).catch(function(err) {
            assert(err.toString().indexOf("invalid opcode") != -1, err.toString());
            return dispute.stage();
        }).then(function(res) {
            assert(String(res) == '0', 'After failed activation the stage should still be 0.');
            return dispute.activateContract({from: partyAddresses[0]});
        }).then(function(res) {
            return dispute.stage();
        }).then(function(res) {
            assert(String(res) == '1', 'After activation the stage should be 1');
        });
    });

    it("should only allow a party to close a contract an initiate the optional dispute time.", function() {
        let dispute;
        const amount = configExpectedCollateral;
        return SimpleDispute.new(configClosingTime, configArbitrationTime, configExpectedCollateral,
            arbitratorAddress, partyAddresses).then(function(instance) {
                dispute = instance;
                return dispute.depositCollateral({from: arbitratorAddress, value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[0], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[1], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.activateContract({from: partyAddresses[0]});
        }).then(function() {
            return dispute.closeContract({from: unauthorizedAddress});
        }).then(function() {}).catch(function(err) {
            assert(err.toString().indexOf("invalid opcode") != -1, err.toString());
            return dispute.closeContract({from: partyAddresses[0]});
        }).then(function() {
            assert(true, "True")
        });
    });

    it("should only allow a party to call for arbitration.", function() {
        let dispute;
        const amount = configExpectedCollateral;
        return SimpleDispute.new(configClosingTime, configArbitrationTime, configExpectedCollateral,
            arbitratorAddress, partyAddresses).then(function(instance) {
                dispute = instance;
                return dispute.depositCollateral({from: arbitratorAddress, value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[0], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[1], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.activateContract({from: partyAddresses[0]});
        }).then(function() {
            return dispute.closeContract({from: partyAddresses[0]});
        }).then(function() {
            return dispute.callArbitration({from: unauthorizedAddress});
        }).then(function() {}).catch(function(err) {
            assert(err.toString().indexOf("invalid opcode") != -1, err.toString());
            return dispute.callArbitration({from: partyAddresses[0]});
        }).then(function() {
            assert(true, "True")
        });
    });

    it("should only allow the arbitrator to award a party with collateral.", function() {
        let dispute;
        const amount = configExpectedCollateral;
        return SimpleDispute.new(configClosingTime, configArbitrationTime, configExpectedCollateral,
            arbitratorAddress, partyAddresses).then(function(instance) {
                dispute = instance;
                return dispute.depositCollateral({from: arbitratorAddress, value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[0], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.depositCollateral({from: partyAddresses[1], value: web3.toWei(amount, 'ether')});
        }).then(function(res) {
            testUtils.assertLogs(res.logs, 'LogDeposit', 'deposited', true, 'hasCollateral should be set to true.');
            return dispute.activateContract({from: partyAddresses[0]});
        }).then(function() {
            return dispute.closeContract({from: partyAddresses[0]});
        }).then(function() {
            return dispute.callArbitration({from: partyAddresses[0]});
        }).then(function() {
            return dispute.awardParty(partyAddresses[0], {from: unauthorizedAddress});
        }).then(function(){}).catch(function(err) {
            assert(err.toString().indexOf("invalid opcode") != -1, err.toString());
            return dispute.awardParty(partyAddresses[0], {from: arbitratorAddress});
        }).then(function() {
            assert(true, 'True');
        }).catch(function(err) {
            assert(err.toString().indexOf("invalid opcode") != -1, err.toString());
        });
    });

    it("should only allow a party to claim an uncooperating arbitrator's money.", function() {

    });

    it("should only allow a party to unlock everyone's collateral if the contract is finished.", function() {

    });
});
