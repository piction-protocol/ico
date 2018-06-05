require('./App');

const input = JSON.parse(fs.readFileSync('build/contracts/PXLG.json'));
const contract = new web3.eth.Contract(input.abi, process.env.PXLG_ADDRESS);
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
            log(`PXLG ADDRESS : ${newContractInstance.options.address}`);
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

const _transfer = (to, amount) => {
    return contract.methods
        .transfer(to, new BigNumber(amount * decimals))
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

    _transfer(answer.to, answer.amount)
}

const tokenRelease = async () => {
    let enquirer = new Enquirer();
    enquirer.question('text', 'type "tokenRelease"');
    enquirer.question('path', 'buyers csv file path');
    let answer = await enquirer.prompt(['text', 'path']);
    if (answer.text != 'tokenRelease' || !answer.path) return;

    let input = fs.readFileSync(answer.path);
    parse(input, (err, output) => {
        awaitEach(output, async function (row) {
            log(`transfer ${to} ${amount}`);
            return await _transfer(row[0], row[1]);
        });
    });
}

const addOwner = async () => {
    enquirer.question('address', 'PXLG add owner address');
    let answer = await enquirer.prompt(['address']);
    if (answer.address == '') return;

    return contract.methods
        .addOwner(answer.address)
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const events = async () => {
    enquirer.question('eventName', 'eventName');
    let answer = await enquirer.prompt(['eventName']);
    if (answer.eventName == '') return;

    contract.getPastEvents(answer.eventName, {
        fromBlock: 0,
        toBlock: 'latest'
    }, (error, events) => {
        events.forEach(obj => {
            console.log(obj)
        });
    });
}

module.exports = {deploy, mint, burn, transfer, tokenRelease, addOwner, events};
require('make-runnable')