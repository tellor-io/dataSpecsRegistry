// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "usingtellor/contracts/TellorPlayground.sol";

contract MockTellorMaster is TellorPlayground {
    mapping(bytes32 => address) public addresses;

    constructor() TellorPlayground() {}

    function getAddressVars(bytes32 _hash) external view returns(address) {
        return addresses[_hash];
    }

    function mockUpdateOracleAddress(address _newOracleAddress) public {
        bytes32 _oracleAddressKeyHash = keccak256("_ORACLE_ADDRESS");
        addresses[_oracleAddressKeyHash] = _newOracleAddress;
    }
}