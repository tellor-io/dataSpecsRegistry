// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "usingtellor/contracts/UsingTellor.sol";
import "./interfaces/ITellorMaster.sol";

/**
 @author Tellor Inc.
 @title DataSpecsRegistry
 @dev This is a registry for Tellor oracle data specifications. It allows users to register 
* a query type name and manage a data specs document by setting its IPFS hash. Registration
* fees are paid in TRB and are calculated based on the current price of TRB in USD. 
*/

contract DataSpecsRegistry is UsingTellor {
    ITellorMaster public token; // TRB token used for registration fee, also TellorMaster contract
    address public feeRecipient; // recipient of registration fees
    bytes32 public constant trbPriceQueryId =
        keccak256(abi.encode("SpotPrice", abi.encode("trb", "usd"))); // used for fee calculated
    uint256 public lastSavedTrbPrice = 15e18; // last saved price of TRB in USD
    uint256 public registrationPricePerYearUSD; // fee paid for 1 year spec registration in USD
    uint256 public registrationPricePerInifinityUSD; // fee paid for infinite time spec registration in USD (SHOULD THIS BE REMOVED?)

    mapping(string => Spec) public specs; // mapping (queryType string => Spec)
    string[] public allRegisteredQueryTypes; // record of every query type ever registered

    struct Spec {
        address owner; // sets the manager and owner addresses
        address manager; // sets the document hash and lock time
        string documentHash; // IPFS hash of data specs document (ex: ipfs://bafybeic6nwiuutq2fs3wq7qg5t5xcqghg6bnv65atis3aphjtatb26nc5u)
        uint256 expirationTime; // timestamp when spec registration expires
        bool registered; // registered at some point in time
    }

    // Events
    event DocumentHashUpdated(string _queryType, string _documentHash);
    event ManagerUpdated(string _queryType, address _manager);
    event NewRegistration(string _queryType, address _owner, uint256 _expirationTime);
    event OwnerUpdated(string _queryType, address _owner);
    event RegistrationExtended(string _queryType, uint256 _expirationTime);
    event TellorAddressUpdated(address _tellorAddress);

    // Functions
    /**
     * @dev Initializes system parameters
     * @param _tellorMaster tellor master and token address
     * @param _tellor oracle address
     * @param _feeRecipient address which receives all fees collected by this contract
     * @param _reservedOwner address which owns all reserved query types
     * @param _registrationPricePerYearUSD fee paid for 1 year spec registration in USD
     */
    constructor(
        address _tellorMaster,
        address payable _tellor,
        address _feeRecipient,
        address _reservedOwner,
        uint256 _registrationPricePerYearUSD
    ) UsingTellor(_tellor) {
        require(
            _tellorMaster != address(0),
            "Tellor master address cannot be zero"
        );
        require(_tellor != address(0), "Tellor oracle address cannot be zero");
        require(
            _feeRecipient != address(0),
            "Fee recipient address cannot be zero"
        );

        token = ITellorMaster(_tellorMaster);
        feeRecipient = _feeRecipient;
        registrationPricePerYearUSD = _registrationPricePerYearUSD;
        registrationPricePerInifinityUSD = _registrationPricePerYearUSD * 20;

        string[35] memory _reservedQueries = [
            "AmpleforthCustomSpotPrice",
            "AmpleforthUSPCE",
            "AutopayAddresses",
            "ChatGPTResponse",
            "ComboQuery",
            "CrossChainBalance",
            "Custom1",
            "Custom2",
            "Custom3",
            "CustomPrice",
            "DIVAProtocol",
            "DailyVolatility",
            "EVMCall",
            "EVMHeader",
            "EVMHeaderslist",
            "ExampleFantasyFootball",
            "ExampleNftCollectionStats",
            "FilecoinDealStatus",
            "GasPriceOracle",
            "LeagueDAO",
            "LegacyRequest",
            "LendingPairToxicity",
            "MimicryCollectionStat",
            "MimicryMacroMarketMashup",
            "MimicryNFTMarketIndex",
            "Morphware",
            "NumericApiResponse",
            "Snapshot",
            "SpotPrice",
            "TWAP",
            "TellorKpr",
            "TellorOracleAddress",
            "TellorRNG",
            "TracerFinance",
            "TwitterContestV1"
        ];

        for (uint256 _i = 0; _i < _reservedQueries.length; _i++) {
            Spec storage _spec = specs[_reservedQueries[_i]];
            _spec.owner = _reservedOwner;
            _spec.manager = _reservedOwner;
            _spec.expirationTime = type(uint256).max;
            _spec.registered = true;
            allRegisteredQueryTypes.push(_reservedQueries[_i]);
        }
    }

    /**
     * @dev Extends an existing registration
     * @param _queryType query type string identifier
     * @param _amount amount of TRB to pay for extended registration, USD value determines length of extension
     */
    function extendRegistration(
        string calldata _queryType,
        uint256 _amount
    ) public {
        Spec storage _spec = specs[_queryType];
        require(
            _spec.expirationTime > block.timestamp,
            "Query type not registered"
        );
        uint256 _amountInUSD = _getAmountInUSD(_amount);
        if (_amountInUSD >= registrationPricePerInifinityUSD) {
            _spec.expirationTime = type(uint256).max;
        } else {
            _spec.expirationTime +=
                (_amountInUSD * 31536000) /
                registrationPricePerYearUSD;
        }
        require(
            token.transferFrom(msg.sender, feeRecipient, _amount),
            "Fee transfer failed"
        );
        emit RegistrationExtended(_queryType, _spec.expirationTime);
    }

    /**
     * @dev Registers a new query type
     * @param _queryType query type string identifier
     * @param _amount amount of TRB to pay for registration, USD value determines length of registration
     * @notice a minimum of 1 year registration is required
     */
    function register(string calldata _queryType, uint256 _amount) public {
        Spec storage _spec = specs[_queryType];
        require(
            _spec.expirationTime < block.timestamp,
            "Query type registered"
        );
        uint256 _amountInUSD = _getAmountInUSD(_amount);
        require(
            _amountInUSD >= registrationPricePerYearUSD,
            "Must register for at least one year"
        );
        require(
            token.transferFrom(msg.sender, feeRecipient, _amount),
            "Fee transfer failed"
        );
        if (_amountInUSD >= registrationPricePerInifinityUSD) {
            _spec.expirationTime = type(uint256).max;
        } else {
            _spec.expirationTime =
                block.timestamp +
                (_amountInUSD * 31536000) /
                registrationPricePerYearUSD;
        }
        _spec.owner = msg.sender;
        _spec.manager = msg.sender;
        if (!_spec.registered) {
            allRegisteredQueryTypes.push(_queryType);
            _spec.registered = true;
        }
        emit NewRegistration(_queryType, msg.sender, _spec.expirationTime);
    }

    /**
     * @dev Sets a document hash
     * @param _queryType query type string identifier
     * @param _documentHash data specs document hash (IPFS hash), ex: ipfs://Qm...
     */
    function setDocumentHash(
        string calldata _queryType,
        string calldata _documentHash
    ) public {
        Spec storage _spec = specs[_queryType];
        require(
            msg.sender == _spec.manager,
            "Only spec manager can set content record"
        );
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        _spec.documentHash = _documentHash;
        emit DocumentHashUpdated(_queryType, _documentHash);
    }

    /**
     * @dev Sets a manager address
     * @param _queryType query type string identifier
     * @param _manager new manager address
     */
    function setManagerAddress(
        string calldata _queryType,
        address _manager
    ) public {
        Spec storage _spec = specs[_queryType];
        require(
            msg.sender == _spec.owner,
            "Only admin can change manager address"
        );
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        _spec.manager = _manager;
        emit ManagerUpdated(_queryType, _manager);
    }

    /**
     * @dev Sets a new owner address
     * @param _queryType query type string identifier
     * @param _newOwner new owner address
     */
    function setOwnerAddress(
        string calldata _queryType,
        address _newOwner
    ) public {
        Spec storage _spec = specs[_queryType];
        require(
            msg.sender == _spec.owner,
            "Only owner can change owner address"
        );
        require(block.timestamp < _spec.expirationTime, "Registration expired");
        _spec.owner = _newOwner;
        emit OwnerUpdated(_queryType, _newOwner);
    }

    /**
     * @dev Sets a new Tellor oracle address by reading from Tellor Master's storage
     */
    function updateTellorAddress() public {
        tellor = ITellor(token.getAddressVars(keccak256("_ORACLE_CONTRACT")));
        emit TellorAddressUpdated(address(tellor));
    }

    // Getters
    /**
     * @dev Returns an array of all registered query type name strings
     * @return string[] array of all registered query type name strings
     * @notice this function returns all registered query types, including expired ones
     */
    function getAllRegisteredQueryTypes()
        external
        view
        returns (string[] memory)
    {
        return allRegisteredQueryTypes;
    }

    /**
     * @dev Returns the registration cost per year in TRB
     * @return uint256 cost per year in TRB
     */
    function getCostPerYearInTRB() external view returns (uint256) {
        (
            bytes memory _trbPriceBytes,
            uint256 _timestampRetrieved
        ) = getDataBefore(trbPriceQueryId, block.timestamp - 12 hours);
        uint256 _trbPrice;
        if (_timestampRetrieved > 0) {
            _trbPrice = abi.decode(_trbPriceBytes, (uint256));
        } else {
            _trbPrice = lastSavedTrbPrice;
        }
        return (registrationPricePerYearUSD * 1e18) / _trbPrice;
    }

    /**
     * @dev Returns the query type name by index
     * @param _index index in allRegisteredQueryTypes array
     * @return string query type name
     */
    function getRegisteredQueryTypeByIndex(
        uint256 _index
    ) external view returns (string memory) {
        return allRegisteredQueryTypes[_index];
    }

    /**
     * @dev Returns the number of unique query type names ever registered
     * @return uint256 number of registered query types
     */
    function getRegisteredQueryTypeCount() external view returns (uint256) {
        return allRegisteredQueryTypes.length;
    }

    /**
     * @dev Returns the registration info for a given query type
     * @param _queryType query type string identifier
     * @return Spec struct
     */
    function getRegistration(
        string calldata _queryType
    ) external view returns (Spec memory) {
        return specs[_queryType];
    }

    // Internal functions
    /**
     * @dev Returns the USD value of a given amount of TRB
     * @param _amount amount of TRB
     * @return uint256 USD value of TRB
     */
    function _getAmountInUSD(uint256 _amount) internal returns (uint256) {
        (
            bytes memory _trbPriceBytes,
            uint256 _timestampRetrieved
        ) = getDataBefore(trbPriceQueryId, block.timestamp - 12 hours);
        uint256 _amountInUsd;
        if (_timestampRetrieved > 0) {
            uint256 _trbPrice = abi.decode(_trbPriceBytes, (uint256));
            _amountInUsd = (_amount * _trbPrice) / 1e18;
            lastSavedTrbPrice = _trbPrice;
        } else {
            _amountInUsd = (_amount * lastSavedTrbPrice) / 1e18;
        }
        return _amountInUsd;
    }
}
