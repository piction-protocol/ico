const env = require("./../env");
const PXL = artifacts.require("PXL");
const decimals = Math.pow(10, 18);

module.exports = async (deployer, network) => {
    if (network == 'testnet_token') {        
        var token = await PIXL.new(10000 * decimals);
        token.transfer(env.testnet.developersAddress, 5000 * decimals);
    } else if (network == 'mainnet_token') {
        deployer.deploy(contract, 10000);
    }
};