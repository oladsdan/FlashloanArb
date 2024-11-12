import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const mainnet_provider_url = process.env.MAINNET_PROVIDER_URL;
const testnet_provider_url = process.env.TESTNET_PROVIDER_URL;
const accounts = process.env.PRIVATE_KEY;
// console.log(mainnet_provider_url);


const config: HardhatUserConfig = {
  solidity: { compilers: [{ version: "0.8.10" }, { version: "0.8.13" }]},
  networks: {
    hardhat: {
      forking: {
        url: "https://binance.llamarpc.com",
        // url: mainnet_provider_url!,
      }
      
    },
    mainnet: {
      url: mainnet_provider_url,
      chainId: 56,
      accounts: [accounts!]
    },
    testnet: {
      url: testnet_provider_url,
      accounts: [accounts!],
      chainId: 97
    }

  }
};

export default config;
