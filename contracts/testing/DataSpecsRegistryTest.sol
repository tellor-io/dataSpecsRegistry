// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "../DataSpecsRegistry.sol";

contract DataSpecsRegistryTest is DataSpecsRegistry {
    uint256 public amountUSD; 

    constructor(
        address _tellorMaster,
        address payable _tellor,
        address _feeRecipient,
        address _reservedOwner,
        uint256 _registrationPricePerYearUSD) DataSpecsRegistry(
            _tellorMaster,
            _tellor,
            _feeRecipient,
            _reservedOwner,
            _registrationPricePerYearUSD) {}

    function getAmountInUSD(uint256 _amount) public {
        amountUSD = _getAmountInUSD(_amount);
    }
}
