require('dotenv-flow').config({default_node_env: 'ropsten'});
global.fs = require('fs');
global.parse = require('csv-parse')
global.Web3 = require('web3');
global.BigNumber = require('bignumber.js');
global.decimals = Math.pow(10, 18);
global.awaitEach = require('await-each')
global.chunks = require('array.chunk');
global.Confirm = require('prompt-confirm');
global.Enquirer = require('enquirer');
global.colors = require('colors');
global.replace = require('replace-in-file');

global.log = (message) => console.log(colors.green.bold(message))
global.error = (message) => console.log(colors.red.bold(message))

global.web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.NODE_ENV}.infura.io/`));
web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

if (!process.env.PRIVATE_KEY) {
    error(`Please register your private key! (.env.${process.env.NODE_ENV} file)`)
    process.exit(0)
}
error(`CURRENT_ADDRESS : ${web3.eth.accounts.wallet[0].address}`);

global.sendDefaultParams = {
    from: web3.eth.accounts.wallet[0].address,
    gas: 3000000,
    gasPrice: '100000000000'
}