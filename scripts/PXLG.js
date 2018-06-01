require('dotenv-flow').config({default_node_env: 'ropsten'});
const fs = require('fs');
const csv = require('csv-parser')
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const decimals = Math.pow(10, 18);
const input = JSON.parse(fs.readFileSync('build/contracts/PXLG.json'));

const web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.NODE_ENV}.infura.io/`));
web3.eth.accounts.wallet.add(`0x${process.env.PRIVATE_KEY}`);

const contract = new web3.eth.Contract(input.abi, process.env.PXLG_TOKEN_ADRESS);
const sendDefaultParams = {
    from: web3.eth.accounts.wallet[0].address,
    gas: 6000000,
    gasPrice: '100000000000'
}

const deploy = initialSupply => {
    let contract = new web3.eth.Contract(input.abi);
    contract.deploy({
        data: input.bytecode,
        arguments: [new BigNumber(initialSupply * decimals)]
    })
        .send(sendDefaultParams)
        .then(receipt => {
            console.log('receipt', receipt)
        });
};

const mint = amount => {
    contract.methods
        .mint(new BigNumber(amount * decimals))
        .send(sendDefaultParams)
        .then(receipt => {
            console.log('receipt', receipt)
        });
}

const burn = amount => {
    contract.methods
        .burn(new BigNumber(amount * decimals))
        .send(sendDefaultParams)
        .then(receipt => {
            console.log('receipt', receipt)
        });
}

const transfer = (to, amount) => {
    console.log('transfer', to, amount);
    return contract.methods
        .transfer(to, new BigNumber(amount * decimals))
        .send(sendDefaultParams)
        .then(receipt => {
            console.log('receipt', receipt)
        });
}

const tokenRelease = () => {
    const list = [];
    const _promise = (address, amount) => {
        return new Promise(async (resolve) => {
            await transfer(address, amount);
            resolve();
        })
    }
    fs.createReadStream('scripts/pxlg_source.csv').pipe(csv())
        .on('data', data => list.push(data))
        .on('end', () => list.reduce((promise, row, index) =>
            promise.then(_ => _promise(row.ADDRESS, row.AMOUNT)), Promise.resolve())
        );
}

const events = eventName => {
    contract.getPastEvents(eventName, {
        fromBlock: 0,
        toBlock: 'latest'
    }, (error, events) => {
        events.forEach(obj => {
            console.log(obj)
            // console.log(obj.event)
            // console.log(obj.returnValues.to)
            // console.log(obj.returnValues.value)
        })
    });
}
module.exports = {deploy, mint, burn, transfer, tokenRelease, events};
require('make-runnable')