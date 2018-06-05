require('./App');

const input = JSON.parse(fs.readFileSync('build/contracts/PXL.json'));
const contract = new web3.eth.Contract(input.abi, process.env.PXL_ADDRESS);
const enquirer = new Enquirer();

const deploy = async () => {
    enquirer.question('initialSupply', 'initialSupply');
    enquirer.question('confirmInitialSupply', 'initialSupply (confirm)');
    let answer = await enquirer.prompt(['initialSupply', 'confirmInitialSupply']);
    if (!parseInt(answer.initialSupply) || answer.initialSupply != answer.confirmInitialSupply) return;

    let contract = new web3.eth.Contract(input.abi);
    contract.deploy({
        data: input.bytecode,
        arguments: [new BigNumber(answer.initialSupply * decimals)]
    })
        .send(sendDefaultParams)
        .then(newContractInstance => {
            log(`PXL ADDRESS : ${newContractInstance.options.address}`);
        });
};

const mint = async () => {
    enquirer.question('amount', 'amount');
    enquirer.question('confirmAmount', 'amount (confirm)');
    let answer = await enquirer.prompt(['amount', 'confirmAmount']);
    if (!parseInt(answer.amount) || answer.amount != answer.confirmAmount) return;

    contract.methods
        .mint(new BigNumber(answer.amount * decimals))
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const burn = async () => {
    enquirer.question('amount', 'amount');
    enquirer.question('confirmAmount', 'amount (confirm)');
    let answer = await enquirer.prompt(['amount', 'confirmAmount']);
    if (!parseInt(answer.amount) || answer.amount != answer.confirmAmount) return;

    contract.methods
        .burn(new BigNumber(answer.amount * decimals))
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const transfer = async () => {
    enquirer.question('to', 'address');
    enquirer.question('amount', 'amount');
    enquirer.question('confirmAmount', 'amount (confirm)');
    let answer = await enquirer.prompt(['to', 'amount', 'confirmAmount']);
    if (answer.to == '') return;
    if (!parseInt(answer.amount) || answer.amount != answer.confirmAmount) return;

    contract.methods
        .transfer(answer.to, new BigNumber(answer.amount * decimals))
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const addOwner = async () => {
    enquirer.question('address', 'address');
    enquirer.question('confirmAddress', 'address (confirm)');
    let answer = await enquirer.prompt(['address', 'confirmAddress']);
    if (answer.address == '' || answer.address != answer.confirmAddress) return;

    return contract.methods
        .addOwner(answer.address)
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

module.exports = {deploy, mint, burn, transfer, addOwner};
require('make-runnable')