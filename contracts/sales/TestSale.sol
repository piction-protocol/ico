pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Whitelist.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";


contract TestSale is Whitelist, Pausable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    uint256 public constant maxcap = 100 ether;
    uint256 public constant exceed = 10 ether;
    uint256 public constant minimum = 0.1 ether;
    uint256 public constant rate = 1000;

    uint256 public weiRaised;
    address public wallet;
    ERC20 public token;

    constructor (address _wallet, address _token) public {
        require(_wallet != address(0));
        require(_token != address(0));

        wallet = _wallet;
        token = ERC20(_token);
        weiRaised = 0;
    }

    //////////////////
    //  collect eth
    //////////////////

    mapping(address => uint256) public buyers;
    address[] private keys;

    function() external payable {
        collect(msg.sender);
    }

    function collect(address _buyer) public payable {
        require(_buyer != address(0));
        require(weiRaised <= maxcap);
        require(preValidation());
        require(buyers[_buyer] < exceed);

        // get exist amount
        if (buyers[_buyer] == 0) {
            keys.push(_buyer);
        }

        uint256 purchase = getPurchaseAmount(_buyer);
        uint256 refund = (msg.value).sub(purchase);

        // refund
        _buyer.transfer(refund);

        // buy
        uint256 tokenAmount = purchase.mul(rate);
        weiRaised = weiRaised.add(purchase);

        // wallet
        buyers[_buyer] = buyers[_buyer].add(purchase);
        emit BuyTokens(_buyer, purchase, tokenAmount);
    }

    //////////////////
    //  validation functions for collect
    //////////////////

    function preValidation() private constant returns (bool) {
        // check minimum
        return msg.value >= minimum;
    }

    function getPurchaseAmount(address _buyer) private constant returns (uint256) {
        return checkOverMaxcap(checkOverExceed(_buyer));
    }

    // 1. check over exceed
    function checkOverExceed(address _buyer) private constant returns (uint256) {
        if (msg.value >= exceed) {
            return exceed;
        } else if (msg.value.add(buyers[_buyer]) >= exceed) {
            return exceed.sub(buyers[_buyer]);
        } else {
            return msg.value;
        }
    }

    // 2. check sale hardcap
    function checkOverMaxcap(uint256 amount) private constant returns (uint256) {
        if ((amount + weiRaised) >= maxcap) {
            return (maxcap.sub(weiRaised));
        } else {
            return amount;
        }
    }

    //////////////////
    //  release
    //////////////////
    bool finalized = false;

    function release() external onlyOwner {
        require(!finalized);
        require(weiRaised >= maxcap);

        wallet.transfer(address(this).balance);

        for (uint256 i = 0; i < keys.length; i++) {
            token.safeTransfer(keys[i], buyers[keys[i]].mul(rate));
            emit Release(keys[i], buyers[keys[i]].mul(rate));
        }

        withdraw();

        finalized = true;
    }

    function refund() external onlyOwner {
        require(!finalized);
        pause();

        withdraw();

        for (uint256 i = 0; i < keys.length; i++) {
            keys[i].transfer(buyers[keys[i]]);
            emit Refund(keys[i], buyers[keys[i]]);
        }

        finalized = true;
    }

    function withdraw() public onlyOwner {
        token.safeTransfer(wallet, token.balanceOf(this));
        emit Withdraw(wallet, token.balanceOf(this));
    }

    //////////////////
    //  events
    //////////////////

    event Release(address indexed _to, uint256 _amount);
    event Withdraw(address indexed _from, uint256 _amount);
    event Refund(address indexed _to, uint256 _amount);
    event BuyTokens(address indexed buyer, uint256 price, uint256 tokens);
}