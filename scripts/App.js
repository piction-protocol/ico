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

global.web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.NODE_ENV}.infura.io/`));
web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

global.sendDefaultParams = {
    from: web3.eth.accounts.wallet[0].address,
    gas: 6000000,
    gasPrice: '100000000000'
}

global.log = (message) => {
    console.log(colors.green.bold(message));
}
global.error = (message) => {
    console.log(colors.red.bold(message));
}

const resetEnv = async () => {
    let enquirer = new Enquirer();
    enquirer.register('confirm', require('prompt-confirm'));
    enquirer.question('confirm', `reset ${process.env.NODE_ENV} env`, {type: 'confirm'});
    let answer = await enquirer.prompt(['confirm']);
    if (!answer.confirm) return;

    var rd = fs.createReadStream('.env');
    var wr = fs.createWriteStream(`.env.${process.env.NODE_ENV}`);
    try {
        return await new Promise(function (resolve, reject) {
            rd.on('error', reject);
            wr.on('error', reject);
            wr.on('finish', resolve);
            rd.pipe(wr);
        });
    } catch (error) {
        rd.destroy();
        wr.end();
        throw error;
    }
}

module.exports = {resetEnv};
require('make-runnable')