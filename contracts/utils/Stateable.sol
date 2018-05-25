pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Stateable is Ownable {
    enum State{Unknown, Preparing, Starting, Pausing, Completed, Finalized}
    State state;

    event OnStateChange(string _state);

    function Stateable() {
        state = State.Unknown;
    }

    function setState(State _state) internal onlyOwner {
        state = _state;
        emit OnStateChange(getMyEnumKeyByValue(state));
    }

    function getState() internal view returns (State) {
        return state;
    }

    function getMyEnumKeyByValue (State _state) private view returns (string) {
        if (State.Preparing == state) return "Preparing";
        if (State.Starting == state) return "Starting";
        if (State.Pausing == state) return "Pausing";
        if (State.Completed == state) return "Completed";
        if (State.Finalized == state) return "Finalized";
        return "";
    }
}
