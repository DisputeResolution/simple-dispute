var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "trick holiday opera right adult govern various capable wide jaguar ski connect";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
  },
    ropsten: {
        provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"),
        network_id: 3
    }
  }
};
