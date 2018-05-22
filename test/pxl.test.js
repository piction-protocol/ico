var PXL = artifacts.require("PXL");

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('PXL', function (accounts) {
    const owner = accounts[0];
    const developer = accounts[1];

    const decimals = Math.pow(10, 18);
    const initialBalance = 10000 * decimals;
    const sendPXL = 3000 * decimals;

    let token;


    beforeEach("setup contract for each test", async () => {
        token = await PXL.new(initialBalance, { from: owner });
    });

    it("Check Initial balance in Owner account.", async () => {
        const balance = await token.balanceOf.call(owner);
        console.log("Owner address :", owner);
        balance.should.be.bignumber.equal(initialBalance);
    });

    it("Send 3000 pixel to developer account.", async () => {
        const before = await token.balanceOf.call(owner);
        await token.transfer(developer, sendPXL);
        const after = await token.balanceOf.call(owner);
        const devBalance = await token.balanceOf.call(developer);
        
        console.log("Owner address :", owner);
        console.log("developer address :", developer);

        before.minus(after).should.be.bignumber.equal(sendPXL);
        devBalance.should.be.bignumber.equal(sendPXL);
      });
});