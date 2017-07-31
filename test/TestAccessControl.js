const SimpleDispute = artifacts.require("SimpleDispute");
const increaseTime = require('../utils/increaseTime');
const expectThrow = require('../utils/expectThrow');

contract("AccessControl", function(accounts) {
    let dispute;
    const configClosingTime = 2;
    const configArbitrationTime = 2;
    const configExpectedCollateral = 1;
    const arbitratorAddress = accounts[0];
    const partyAddresses = [accounts[1], accounts[2]];
    const unauthorizedAddress = accounts[3];
    const amount = web3.toWei(1, 'ether');

    beforeEach(async () => {
         dispute = await SimpleDispute.new(configClosingTime, configArbitrationTime,
                                           configExpectedCollateral, arbitratorAddress, partyAddresses);
         await dispute.depositCollateral({from: arbitratorAddress, value: amount});
         await dispute.depositCollateral({from: partyAddresses[0], value: amount});
         await dispute.depositCollateral({from: partyAddresses[1], value: amount});
    });

    it("should only allow a party to activate the contract.", async () => {
        assert.equal(await dispute.stage(), '0', 'Before activation the stage should be 0.');
        expectThrow(dispute.activateContract({from: unauthorizedAddress}));
        assert.equal(await dispute.stage(), '0', 'After failed activation the stage should still be 0.');
        await dispute.activateContract({from: partyAddresses[0]});
        assert.equal(await dispute.stage(), '1', 'After successful activation the stage should be 1');
    });

    it("should only allow a party to close a contract an initiate the optional dispute time.", async function() {
        await dispute.activateContract({from: partyAddresses[0]});
        expectThrow(dispute.closeContract({from: unauthorizedAddress}));
        await dispute.closeContract({from: partyAddresses[0]});
        assert.equal(await dispute.stage(), '2', 'After successful contract closure the stage should be 2');
    });

    it("should only allow a party to call for arbitration.", async () => {
        await dispute.activateContract({from: partyAddresses[0]});
        await dispute.closeContract({from: partyAddresses[0]});
        expectThrow(dispute.callArbitration({from: unauthorizedAddress}));
        await dispute.callArbitration({from: partyAddresses[0]});
        assert.equal(await dispute.stage(), '3', 'After successful call for arbitration the stage should be 3');
    });

    it("should only allow the arbitrator to award a party with collateral.", async () => {
        await dispute.activateContract({from: partyAddresses[0]});
        await dispute.closeContract({from: partyAddresses[0]});
        await dispute.callArbitration({from: partyAddresses[0]});
        expectThrow(dispute.awardParty(partyAddresses[0], {from: unauthorizedAddress}));
        await dispute.awardParty(partyAddresses[0], {from: arbitratorAddress});
        assert.equal(await dispute.stage(), '4', 'After awarding collateral the stage should be 4');
    });

    it("should only allow a party to claim an uncooperating arbitrator's money.", async () => {
        await dispute.activateContract({from: partyAddresses[0]});
        await dispute.closeContract({from: partyAddresses[0]});
        await  dispute.callArbitration({from: partyAddresses[0]});
        increaseTime(200000);
        expectThrow(dispute.claimArbitratorMoney({from: unauthorizedAddress}));
        await dispute.claimArbitratorMoney({from: partyAddresses[0]});
        assert.equal(await dispute.stage(), '4', 'After claiming arbitrator money the stage should be 4');
    });
});
