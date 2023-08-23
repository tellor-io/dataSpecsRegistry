## Overview <a name="overview"> </a>  

<b>DataSpecsRegistry</b> is an on-chain registry for tellor oracle query types. Users register a query type name and pay a fee which determines the registration duration. The user then sets the IPFS document hash of the dataspec document in the registry contract. This provides an on-chain, tamperproof record of all Tellor query type definitions. [See the official frontend](https://tellorregistry.eth.limo/) to view and manage query type registrations.

## Deployed Contracts

### Polygon - Official Depoloyment
[0x06Be23ea84148a5E439dFe2A0bcCE441ea74E2D6](https://polygonscan.com/address/0x06Be23ea84148a5E439dFe2A0bcCE441ea74E2D6)

### Sepolia Testnet
[0x9413c3b2Fb74A7b7e6CDeBa683b31646Ceb534F2](https://sepolia.etherscan.io/address/0x9413c3b2Fb74A7b7e6CDeBa683b31646Ceb534F2)

## Contract interactions

### Register a Query Type

Registering a query type requires some TRB tokens and a unique query type name string. The minimum registration time is one year, and registrations cost $1000 per year in TRB. To find the current cost per year in TRB, we'll call:
```js
getCostPerYearInTRB()
```
```js
81566068515497554435
```

Now we know the minimum amount of TRB we need to register our query type.

Next, we will approve the token transfer in the token contract by inputting the registry contract address and an amount for one year's worth of tokens. 

```js
approve(0x9413c3b2Fb74A7b7e6CDeBa683b31646Ceb534F2, 81566068515497554435)
```

Now we can register our query type in the registry contract. For the name of our query type, we'll use `ExampleQueryType`, and again we'll input a token fee amount for a one year registration.

```js
register("ExampleQueryType", 81566068515497554435)
```

We have officially registered a query type, but now we need to set our IPFS data specs document hash. There are many ways to get a document on IPFS, but one quick solution can be found at [nft.storage](https://nft.storage/docs/how-to/nftup/). 

```js
setDocumentHash("ExampleQueryType", "ipfs://bafkreid6oxrxb3j4kmwmcxjkhjniqkza6teynot3m72v27ndu36usnrnxm")
```

Now we finally have a query type registered. 

### Manage a Query Type

There are a few actions you can take to manage your query type. The following function can be used to extend the registration time for an existing query type. It can be called by anyone, and any amount of tokens can be paid. 

```js
extendRegistration("ExampleQueryType", 40000000000000000000)
```

Each query type registration has a manager role and an owner role. The manager can set the document hash, and the owner can change the manager address and the owner address. The manager and owner addresses can be changed using these functions.

```js
setManagerAddress("ExampleQueryType", 0xEXAMPLE_ADDRESS)
```

```js
setOwnerAddress("ExampleQueryType", 0xEXAMPLE_ADDRESS)
```

### Query the Registry

Get a list of all registered query type names:

```js
getAllRegisteredQueryTypes()
```

Get the registration cost per year in TRB tokens:

```js
getCostPerYearInTRB()
```

Get all info for a given query type registration:
```js
getRegistration("ExampleQueryType")
```

Returns a struct in this form:

```js
struct Spec {
    address owner; // sets the manager and owner addresses
    address manager; // sets the document hash and lock time
    string documentHash; // IPFS hash of data specs document (ex: ipfs://bafybeic6nwiuutq2fs3wq7qg5t5xcqghg6bnv65atis3aphjtatb26nc5u)
    uint256 expirationTime; // timestamp when spec registration expires
    bool registered; // registered at some point in time
}
```






## Setting up and testing

Install Dependencies
```
npm i
```
Compile Smart Contracts
```
npx hardhat compile
```

Test Locally
```
npx hardhat test
```

## Maintainers <a name="maintainers"> </a>
This repository is maintained by the [Tellor team](https://github.com/orgs/tellor-io/people)


## How to Contribute<a name="how2contribute"> </a>  

Check out our issues log here on Github or feel free to reach out anytime [info@tellor.io](mailto:info@tellor.io)

## Copyright

Tellor Inc. 2023
