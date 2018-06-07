require('./App');

const input = JSON.parse(fs.readFileSync('build/contracts/Presale.json'));
const contract = new web3.eth.Contract(input.abi, process.env.PRESALE_ADDRESS);
const enquirer = new Enquirer();

if (process.env.PRESALE_ADDRESS) {
    log(`PRESALE_ADDRESS : ${process.env.PRESALE_ADDRESS}`)
} else {
    error('PRESALE_ADDRESS : Not registered yet!')
}

var questions = [{
    type: 'radio',
    name: 'result',
    message: 'Which function do you want to run?',
    choices: ['deploy', 'getState', 'pause', 'start', 'complete', 'release', 'refund', 'finalize', 'withdrawToken', 'withdrawEther']
}];

enquirer.register('radio', require('prompt-radio'));
enquirer.ask(questions)
    .then((answers) => eval(answers.result)())
    .catch((err) => log(err));

const deploy = async () => {
    if (!process.env.WALLET_ADDRESS) {
        error('WALLET_ADDRESS is not registered. Please .env.{network} file update!')
        return;
    }
    if (!process.env.WHITELIST_ADDRESS) {
        error('WHITELIST_ADDRESS is not registered. Please .env.{network} file update!')
        return;
    }
    if (!process.env.PXL_ADDRESS) {
        error('WHITELIST_ADDRESS is not registered. Please .env.{network} file update!')
        return;
    }
    let enquirer = new Enquirer();
    enquirer.question('maxcap', 'maxcap(ETH)');
    enquirer.question('exceed', 'exceed(ETH)');
    enquirer.question('minimum', 'minimum(ETH)');
    enquirer.question('rate', 'rate');
    let answer = await enquirer.prompt(['maxcap', 'exceed', 'minimum', 'rate']);
    if (!parseInt(answer.maxcap) || !parseInt(answer.exceed) || !parseInt(answer.minimum) || !parseInt(answer.rate)) return;

    enquirer = new Enquirer();
    enquirer.register('confirm', require('prompt-confirm'));
    enquirer.question('confirmWalletAddress', `confirm WALLET_ADDRESS : ${process.env.WALLET_ADDRESS}`, {type: 'confirm'});
    enquirer.question('confirmWhitelistAddress', `confirm WHITELIST_ADDRESS : ${process.env.WHITELIST_ADDRESS}`, {type: 'confirm'});
    enquirer.question('confirmPXLAddress', `confirm PXL_ADDRESS : ${process.env.PXL_ADDRESS}`, {type: 'confirm'});
    answer = await enquirer.prompt(['confirmWalletAddress', 'confirmWhitelistAddress', 'confirmPXLAddress']);
    if (!answer.confirmWalletAddress || !answer.confirmWhitelistAddress || !answer.confirmPXLAddress) return;

    let contract = new web3.eth.Contract(input.abi);
    contract.deploy({
        data: input.bytecode,
        arguments: [maxcap, exceed, minimum, rate, process.env.WALLET_ADDRESS, process.env.WHITELIST_ADDRESS, process.env.PXL_ADDRESS]
    })
        .send(sendDefaultParams)
        .then(async newContractInstance => {
            log(`PRESALE ADDRESS : ${newContractInstance.options.address}`);
            enquirer.register('confirm', require('prompt-confirm'));
            enquirer.question('status', `update ${process.env.NODE_ENV} env`, {type: 'confirm'});
            answer = await enquirer.prompt(['status']);
            if (!answer.status) return;
            replace({
                files: `.env.${process.env.NODE_ENV}`,
                from: /PRESALE_ADDRESS=.*/g,
                to: `PRESALE_ADDRESS=${newContractInstance.options.address}`
            })
        });
};

const getState = () => {
    contract.methods
        .getState()
        .call(sendDefaultParams)
        .then(receipt => log(receipt));
};

const pause = async () => {
    let enquirer = new Enquirer();
    enquirer.question('status', 'type "pause"');
    let answer = await enquirer.prompt(['status']);
    if (answer.status != 'pause') return;

    contract.methods
        .pause()
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
};

const start = async () => {
    let enquirer = new Enquirer();
    enquirer.question('status', 'type "start"');
    let answer = await enquirer.prompt(['status']);
    if (answer.status != 'start') return;

    contract.methods
        .start()
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
};

const complete = async () => {
    let enquirer = new Enquirer();
    enquirer.question('status', 'type "complete"');
    let answer = await enquirer.prompt(['status']);
    if (answer.status != 'complete') return;

    contract.methods
        .complete()
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
};

const _release = addrs => {
    return contract.methods
        .release(addrs)
        .send(sendDefaultParams)
        .then(receipt => {
            console.log('receipt', receipt)
        });
}

const release = async () => {
    let enquirer = new Enquirer();
    enquirer.question('text', 'type "release"');
    enquirer.question('path', 'buyers csv file path');
    let answer = await enquirer.prompt(['text', 'path']);
    if (answer.text != 'release' || !answer.path) return;

    let input = fs.readFileSync(answer.path);
    parse(input, {}, (err, output) => {
        let addrs = output.map((obj) => obj[0]);
        let chunkAddrs = chunks(addrs, 2)
        awaitEach(chunkAddrs, async function (row) {
            await _release(row)
        });
    });
}

const _refund = addrs => {
    return contract.methods
        .refund(addrs)
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const refund = async () => {
    let enquirer = new Enquirer();
    enquirer.question('text', 'type "refund"');
    enquirer.question('path', 'buyers csv file path');
    let answer = await enquirer.prompt(['text', 'path']);
    if (answer.text != 'refund' || !answer.path) return;

    let input = fs.readFileSync(answer.path);
    parse(input, {}, (err, output) => {
        let addrs = output.map((obj) => obj[0]);
        let chunkAddrs = chunks(addrs, 2)
        awaitEach(chunkAddrs, async function (row) {
            await _refund(row)
        });
    });
}

const finalize = async () => {
    let enquirer = new Enquirer();
    enquirer.question('text', 'type "finalize"');
    let answer = await enquirer.prompt(['text']);
    if (answer.text != 'finalize') return;

    return contract.methods
        .finalize()
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const withdrawToken = async () => {
    let enquirer = new Enquirer();
    enquirer.question('text', 'type "withdrawToken"');
    let answer = await enquirer.prompt(['text']);
    if (answer.text != 'withdrawToken') return;

    return contract.methods
        .withdrawToken()
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const withdrawEther = async () => {
    let enquirer = new Enquirer();
    enquirer.question('text', 'type "withdrawEther"');
    let answer = await enquirer.prompt(['text']);
    if (answer.text != 'withdrawEther') return;

    return contract.methods
        .withdrawEther()
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}