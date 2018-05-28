pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Stateable is Ownable {
    enum State{Unknown, Preparing, Starting, Pausing, Completed, Finalized}
    State state;

    event OnStateChange(string _state);

    constructor() public {
        state = State.Unknown;
    }

    function setState(State _state) internal onlyOwner {
        state = _state;
        emit OnStateChange(getKeyByValue(state));
    }

    function getState() public view returns (State) {
        return state;
    }

    function getKeyByValue(State _state) public pure returns (string) {
        if (State.Preparing == _state) return "Preparing";
        if (State.Starting == _state) return "Starting";
        if (State.Pausing == _state) return "Pausing";
        if (State.Completed == _state) return "Completed";
        if (State.Finalized == _state) return "Finalized";
        return "";
    }
}
