const SimpleDispute = artifacts.require("SimpleDispute");
const increaseTime = require('../utils/increaseTime');
const expectThrow = require('../utils/expectThrow');

contract("SimpleDispute", function(accounts) {
    let dispute;
    const configClosingTime = 2;
    const configArbitrationTime = 2;
    const configExpectedCollateral = 2;
    const arbitratorAddress = accounts[0];
    const partyAddresses = [accounts[1], accounts[2]];
    const unauthorizedAddress = accounts[3];
    const amount = web3.toWei(2, 'ether');
    const secondsInDay = 86400;

    beforeEach(async () => {
         dispute = await SimpleDispute.new(configClosingTime, configArbitrationTime,
                                           configExpectedCollateral, arbitratorAddress, partyAddresses);
         await dispute.depositCollateral({from: arbitratorAddress, value: amount});
         await dispute.depositCollateral({from: partyAddresses[0], value: amount});
         await dispute.depositCollateral({from: partyAddresses[1], value: amount});
    });

    it("should set up a contract as expected", async () => {
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

    it("should only accept a collateral equal to the expected amount", async () => {
        const smaller_amount = web3.toWei(1, 'ether');
        const larger_amount = web3.toWei(3, 'ether');
        expectThrow(dispute.depositCollateral({from: accounts[5], value: larger_amount}));
        expectThrow(dispute.depositCollateral({from: accounts[5], value: smaller_amount}));
        await dispute.depositCollateral({from: accounts[5], value: amount});
    });

    it("should not accept collateral from someone who already made a successful deposit.", async () => {
        expectThrow(dispute.depositCollateral({from: partyAddresses[0], value: amount}));
    });

    it("shouldn't evaluate arbitrator in depositCollateral if it already assigned collateral to party", async () => {
        const badArbitratorAddress = accounts[0];
        const badPartyAddresses = [accounts[0], accounts[1]];

        dispute = await SimpleDispute.new(configClosingTime, configArbitrationTime,
                                          configExpectedCollateral, arbitratorAddress, partyAddresses);
        await dispute.depositCollateral({from: arbitratorAddress, value: amount});
        await dispute.depositCollateral({from: partyAddresses[1], value: amount});
        expectThrow(dispute.activateContract({from: partyAddresses[1]}));
    });

    it("shouldn't activate when a party doesn't have collateral.", async () => {
        dispute = await SimpleDispute.new(configClosingTime, configArbitrationTime,
                                          configExpectedCollateral, arbitratorAddress, partyAddresses);
        await dispute.depositCollateral({from: arbitratorAddress, value: amount});
        await dispute.depositCollateral({from: partyAddresses[0], value: amount});
        expectThrow(dispute.activateContract({from: partyAddresses[0]}));
    });

    it("shouldn't activate when the arbitrator doesn't have collateral.", async () => {
        dispute = await SimpleDispute.new(configClosingTime, configArbitrationTime,
                                          configExpectedCollateral, arbitratorAddress, partyAddresses);
        await dispute.depositCollateral({from: partyAddresses[0], value: amount});
        await dispute.depositCollateral({from: partyAddresses[1], value: amount});
        expectThrow(dispute.activateContract({from: partyAddresses[0]}));
    });

    it("shouldn't accept a call for arbitration after closingTimeLimit ends.", async () => {
        await dispute.activateContract({from: partyAddresses[0]});
        await dispute.closeContract({from: partyAddresses[0]});
        increaseTime(secondsInDay * (configClosingTime + 1));
        expectThrow(dispute.callArbitration({from: partyAddresses[0]}));
    });

    it("should only accept a party claiming the arbitrator money if the time limit passed.", async () => {
        await dispute.activateContract({from: partyAddresses[0]});
        await dispute.closeContract({from: partyAddresses[0]});
        await dispute.callArbitration({from: partyAddresses[0]});
        expectThrow(dispute.claimArbitratorMoney({from: partyAddresses[0]}));
        assert.equal(await dispute.stage(), '3', 'After failed collecting arbitrator money the stage should still be 3');
        increaseTime(secondsInDay * (configArbitrationTime + 1));
        await dispute.claimArbitratorMoney({from: partyAddresses[0]});
        assert.equal(await dispute.stage(), '4', 'After collecting arbitrator money the stage should be 4');
        assert.isFalse(await dispute.disputeResolved(), 'After collecting arbitrator money the dispute should be flagged as unresolved.');
    });
});
