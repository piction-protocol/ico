const env = require("./../env");

module.exports = function(deployer, network) {
	const contract = artifacts.require("PIXL");
	if(network == 'testnet_token') {
		deployer.deploy(contract, env.testnet.developersAddress);
	} else if(network == 'mainnet_token') {
		deployer.deploy(contract, env.mainnet.developersAddress);
	}  
};