import { ethers} from "hardhat";

//npx hardhat run script/deploy.ts --network mainner
async function main() {
    //taking it to mainnet

    const [deployer] = await ethers.getSigners();
    const deployerBalance = ((await deployer.getBalance()).toString())
    console.log("Signer Account Balance:", deployerBalance);

    const WBNB ="0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

    const FlashLoan = await ethers.getContractFactory("FlashLoan");
    const flashLoan = await FlashLoan.deploy(WBNB, BUSD, 500);
    await flashLoan.deployed();
    //This to copy the address
    console.log("Flashloan Contract Deployed \t:", deployerBalance);
    



}
main().catch((error: any) => {
    console.error(error);
    process.exitCode = 1;
});


