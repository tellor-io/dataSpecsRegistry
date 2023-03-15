// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

interface ITellorMaster {
    function transfer(address _to, uint256 _amount) external returns(bool);
    function transferFrom(address _from, address _to, uint256 _amount) external returns(bool);
    function getAddressVars(bytes32 _hash) external returns(address);
}