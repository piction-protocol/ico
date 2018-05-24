const colors = require('colors');
const Whitelist = artifacts.require("Whitelist");

module.exports = async (deployer, network) => {
    var contract = await Whitelist.new();
    console.log(colors.red('Deployed Whitelist contract'));
    console.log(colors.red('Whitelist address : %s'), contract.address);
};