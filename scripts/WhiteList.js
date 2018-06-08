require('./App');

const input = JSON.parse(fs.readFileSync('build/contracts/Whitelist.json'));
const contract = new web3.eth.Contract(input.abi, process.env.WHITELIST_ADDRESS);
const enquirer = new Enquirer();

if (process.env.WHITELIST_ADDRESS) {
    log(`WHITELIST_ADDRESS : ${process.env.WHITELIST_ADDRESS}`)
} else {
    error('WHITELIST_ADDRESS : Not registered yet!')
}

const choices = process.env.WHITELIST_ADDRESS ? ['deploy', 'add', 'remove', 'find'] : ['deploy'];
const questions = [{
    type: 'radio',
    name: 'result',
    message: 'Which function do you want to run?',
    choices: choices
}];
enquirer.register('radio', require('prompt-radio'));
enquirer.ask(questions)
    .then((answers) => eval(answers.result)())
    .catch((err) => log(err));

const deploy = () => {
    let contract = new web3.eth.Contract(input.abi);
    contract.deploy({
        data: input.bytecode,
        arguments: []
    })
        .send(sendDefaultParams)
        .then(async newContractInstance => {
            log(`WHITELIST ADDRESS : ${newContractInstance.options.address}`);
            enquirer.register('confirm', require('prompt-confirm'));
            enquirer.question('status', `update ${process.env.NODE_ENV} env`, {type: 'confirm'});
            answer = await enquirer.prompt(['status']);
            if (!answer.status) return;
            replace({
                files: `.env.${process.env.NODE_ENV}`,
                from: /WHITELIST_ADDRESS=.*/g,
                to: `WHITELIST_ADDRESS=${newContractInstance.options.address}`
            })
        });
};

const _add = addrs => {
    return contract.methods
        .addAddressesToWhitelist(addrs)
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const add = async () => {
    let enquirer = new Enquirer();
    enquirer.question('path', 'add whitelist csv file path');
    enquirer.question('chunks', 'chunks');
    let answer = await enquirer.prompt(['path', 'chunks']);
    if (!answer.path) return;
    if (!parseInt(answer.chunks) || parseInt(answer.chunks) > 30) {
        error('Chunk size can not be greater than 30.')
        return;
    }

    let input = fs.readFileSync(answer.path);
    parse(input, {}, (err, output) => {
        let addrs = output.map((obj) => obj[0]);
        let chunkAddrs = chunks(addrs, parseInt(answer.chunks))
        awaitEach(chunkAddrs, async function (row) {
            await _add(row)
        });
    });
}

const _remove = addrs => {
    return contract.methods
        .removeAddressesFromWhitelist(addrs)
        .send(sendDefaultParams)
        .then(receipt => log(receipt));
}

const remove = async () => {
    let enquirer = new Enquirer();
    enquirer.question('path', 'remove whitelist csv file path');
    enquirer.question('chunks', 'chunks');
    let answer = await enquirer.prompt(['path', 'chunks']);
    if (!answer.path) return;
    if (!parseInt(answer.chunks) || parseInt(answer.chunks) > 30) {
        error('Chunk size can not be greater than 30.')
        return;
    }

    let input = fs.readFileSync(answer.path);
    parse(input, {}, (err, output) => {
        let addrs = output.map((obj) => obj[0]);
        let chunkAddrs = chunks(addrs, parseInt(answer.chunks))
        awaitEach(chunkAddrs, async function (row) {
            await _remove(row)
        });
    });
}

const find = addr => {
    contract.methods
        .whitelist(addr)
        .call(sendDefaultParams)
        .then(result => {
            log(`whitelist => ${addr} ${result}`)
        });
}