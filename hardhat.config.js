
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.3",
        settings: {
          optimizer: {
            enabled: true,
            runs: 300
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      hardfork: process.env.CODE_COVERAGE ? "berlin" : "london",
      initialBaseFeePerGas: 0,
      accounts: {
        mnemonic:
          "nick lucian brenda kevin sam fiscal patch fly damp ocean produce wish",
        count: 40,
      },
      // forking: {
      //   url: "https://eth-mainnet.alchemyapi.io/v2/7dW8KCqWwKa1vdaitq-SxmKfxWZ4yPG6"
      // },
      allowUnlimitedContractSize: true
    },
      //  mainnet: {
      //    url: `${process.env.NODE_URL_MAINNET}`,
      //    accounts: [process.env.MAINNET_PK],
      //    gas: 3000000,
      //    gasPrice: 35000000000
      //  },
    // sepolia: {
    //     url: `${process.env.NODE_URL_SEPOLIA}`,
    //     accounts: [process.env.TESTNET_PK],
    //     gas: 3000000 ,
    //     gasPrice: 300000000000
    //   },
    polygon: {
      url: `${process.env.NODE_URL_POLYGON}`,
      seeds: [process.env.MAINNET_PK],
      gas: 8000000 ,
      gasPrice: 150000000000
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    // apiKey: process.env.POLYGONSCAN
    apiKey: process.env.POLYGONSCAN
  },

  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },

  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true               // Run the grep's inverse set.
  }

}