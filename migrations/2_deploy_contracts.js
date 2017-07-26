var SimpleDispute = artifacts.require("./SimpleDispute.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleDispute, 2, 2, 2, web3.eth.accounts[0], [
      web3.eth.accounts[1],
      web3.eth.accounts[2],
      web3.eth.accounts[3]]);
};
