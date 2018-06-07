require('./App');

const input = JSON.parse(fs.readFileSync('build/contracts/PXL.json'));
const contract = new web3.eth.Contract(input.abi, process.env.PXL_ADDRESS);
const enquirer = new Enquirer();

error(`PXL_ADDRESS : ${process.env.PXL_ADDRESS ? process.env.PXL_ADDRESS : 'Not registered yet!'}`);

const choices = process.env.PXL_ADDRESS ? ['deploy', 'mint', 'burn', 'transfer', 'addOwner'] : ['deploy'];
const questions = [{
    type: 'radio',
    name: 'result',
    message: 'Which function do you want to run?',
    choices: choices
}];
enquirer.register('radio', require('prompt-radio'));
enquirer.ask(questions).then((answers) => {
    eval(answers.result)()
}).catch(function (err) {
    log(err);
});

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
        .then(async newContractInstance => {
            log(`PXL ADDRESS : ${newContractInstance.options.address}`);
            enquirer.register('confirm', require('prompt-confirm'));
            enquirer.question('status', `update ${process.env.NODE_ENV} env`, {type: 'confirm'});
            answer = await enquirer.prompt(['status']);
            if (!answer.status) return;
            replace({
                files: `.env.${process.env.NODE_ENV}`,
                from: /PXL_ADDRESS=.*/g,
                to: `PXL_ADDRESS=${newContractInstance.options.address}`
            })
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