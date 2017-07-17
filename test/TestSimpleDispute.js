const SimpleDispute = artifacts.require("SimpleDispute");

contract("SimpleDispute", function(accounts) {
    it("activation: there's no initial arbitrator", function() {
        return SimpleDispute.new().then(function(instance) {
            return instance.arbitrator();
        }).then(function(result) {
            assert(result[0].toString() == '0x0000000000000000000000000000000000000000', result[0].toString());
        });
    });

    it("activation: should set an arbitrator", function() {
        var dispute;
        var arbitrator = accounts[0];

        return SimpleDispute.new().then(function(instance) {
            dispute = instance;
            return instance.setArbitrator({from: arbitrator});
        }).then(function() {
            return dispute.arbitrator();
        }).then(function(result) {
            assert(result[0].toString() != '0x0000000000000000000000000000000000000000', result[0].toString());
        });
    });
    it("activation: should throw without arbitrator present", function() {
        return SimpleDispute.new().then(function(instance) {
            return instance.activateContract.call();
        }).then(function(result) {
            assert(false, "It was supposed to throw without arbitrator present but didn't");
        }).catch(function(error) {
            assert(error.toString().indexOf("invalid opcode") != -1, error.toString())
        });
    });

    it("activation: should activate with all parties present", function() {
        let dispute;

        const partyA = accounts[0];
        const partyB = accounts[1];
        const arbitrator = accounts[2];

        return SimpleDispute.new().then(function(instance) {
            dispute = instance;
            return dispute.setPartyA({from: partyA});
        }).then(function() {
            return dispute.setPartyB({from: partyB});
        }).then(function() {
            return dispute.setArbitrator({from: arbitrator});
        }).then(function() {
            return dispute.activateContract();
        }).then(function() {
            assert(true);
        }).catch(function(error) {
            assert(false, error.toString());
        })
    });

    it("activation: should deposit collateral", function() {
        let dispute;
        let amount = 00000000001;
        const arbitrator = accounts[2]
        return SimpleDispute.new().then(function(instance) {
            dispute = instance;
            return dispute.setArbitrator({from: arbitrator, value: amount});
        }).then(function() {
            return dispute.arbitrator();
        }).then(function(result) {
            assert(result[1] == amount, result.toString());
        });
    });

});
