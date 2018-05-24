pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Whitelist.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Presale is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    uint256 public maxcap;
    uint256 public weiRaised;
    uint256 public exceed;
    uint256 public minimum;
    uint256 public rate;

    bool public paused;
    bool public ignited;

    address public wallet;

    Whitelist public whiteList;

    ERC20 public token;

    constructor (
        uint256 _maxcap,
        uint256 _exceed,
        uint256 _minimum,
        uint256 _rate,
        address _wallet,
        address _whitelist,
        address _token
    ) public {
        require(_wallet != address(0));
        require(_whitelist != address(0));
        require(_token != address(0));
        require(_maxcap > _minimum);

        maxcap = _maxcap;
        exceed = _exceed;
        minimum = _minimum;
        rate = _rate;

        wallet = _wallet;

        token = ERC20(_token);

        whiteList = Whitelist(_whitelist);
    }

    function() external payable {
        collect();
    }

    event Change(address _addr, string _name);

    function setWhitelist(address _whitelist) external onlyOwner {
        require(_whitelist != address(0));

        whiteList = Whitelist(_whitelist);
        emit Change(_whitelist, "whitelist");
    }

    function setWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0));

        wallet = _wallet;
        emit Change(_wallet, "wallet");
    }

    event Pause();
    event Resume();
    event Ignite();
    event Extinguish();

    function pause() external onlyOwner {
        paused = true;
        emit Pause();
    }

    function resume() external onlyOwner {
        paused = false;
        emit Resume();
    }

    function ignite() external onlyOwner {
        ignited = true;
        emit Ignite();
    }

    function extinguish() external onlyOwner {
        ignited = false;
        emit Extinguish();
    }

    event Purchase(address indexed _buyer, uint256 _purchased, uint256 _refund, uint256 _tokens);
    event ChangeBuyer(address indexed _from, address indexed _to);

    mapping(address => uint256) public buyers;

    function collect() public payable {
        address buyer = msg.sender;
        uint256 amount = msg.value;

        require(ignited && !paused);
        require(whiteList.whitelist(buyer));
        require(buyer != address(0));
        require(weiRaised < maxcap);
        require(buyers[buyer] < exceed);
        require(buyers[buyer].add(amount) >= minimum);

        uint256 purchase;
        uint256 refund;
        (purchase, refund) = getPurchaseAmount(buyer, amount);

        weiRaised = weiRaised.add(purchase);

        if (weiRaised >= maxcap) {
            ignited = false;
        }

        buyers[buyer] = buyers[buyer].add(purchase);
        emit Purchase(buyer, purchase, refund, purchase.mul(rate));

        if (refund > 0) {
            buyer.transfer(refund);
        }
    }

    function changeBuyerAddress(address _from, address _to) external onlyOwner {
        require(_from != address(0));
        require(_to != address(0));
        require(buyers[_from] > 0);
        require(buyers[_to] == 0);

        buyers[_to] = buyers[_from];
        buyers[_from] = 0;

        emit ChangeBuyer(_from, _to);
    }

    function getPurchaseAmount(address _buyer, uint256 _amount) private view returns (uint256, uint256) {
        uint256 d1 = maxcap.sub(weiRaised);
        uint256 d2 = exceed.sub(buyers[_buyer]);

        uint256 d = (d1 > d2) ? d2 : d1;

        return (_amount > d) ? (d, _amount.sub(d)) : (_amount, 0);
    }

    bool public finalized = false;

    function finalize() external onlyOwner {
        require(!ignited && !finalized);

        withdrawEther();
        withdrawToken();

        finalized = true;
    }

    event Release(address indexed _to, uint256 _amount);
    event Refund(address indexed _to, uint256 _amount);
    event Fail(address indexed _addr, string _reason);

    function release(address _addr) private returns (bool) {
        require(_addr != address(0));

        if (buyers[_addr] == 0) {
            return false;
        }

        uint256 releaseAmount = buyers[_addr].mul(rate);
        buyers[_addr] = 0;

        token.safeTransfer(_addr, releaseAmount);
        emit Release(_addr, releaseAmount);

        return true;
    }

    function release(address[] _addrs) external onlyOwner {
        require(!ignited && !finalized);
        require(_addrs.length <= 30);

        for (uint256 i = 0; i < _addrs.length; i++)
            if (!release(_addrs[i])) {
                emit Fail(_addrs[i], "release");
            }
    }

    function refund(address _addr) private returns (bool) {
        require(_addr != address(0));

        if (buyers[_addr] == 0) {
            return false;
        }

        uint256 refundAmount = buyers[_addr];
        buyers[_addr] = 0;

        _addr.transfer(refundAmount);
        emit Refund(_addr, refundAmount);

        return true;
    }

    function refund(address[] _addrs) external onlyOwner {
        require(!ignited && !finalized);
        require(_addrs.length <= 30);

        for (uint256 i = 0; i < _addrs.length; i++)
            if (!refund(_addrs[i])) {
                emit Fail(_addrs[i], "refund");
            }
    }

    event WithdrawToken(address indexed _from, uint256 _amount);
    event WithdrawEther(address indexed _from, uint256 _amount);

    function withdrawToken() public onlyOwner {
        require(!ignited);

        if (token.balanceOf(address(this)) > 0) {
            token.safeTransfer(wallet, token.balanceOf(address(this)));
            emit WithdrawToken(wallet, token.balanceOf(address(this)));
        }
    }

    function withdrawEther() public onlyOwner {
        require(!ignited);

        wallet.transfer(address(this).balance);
        emit WithdrawEther(wallet, address(this).balance);
    }
}