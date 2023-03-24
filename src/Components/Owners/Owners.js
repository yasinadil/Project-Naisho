const ethers = require("ethers");
const abi = require("../ABI/ABI2");
var fs = require("fs");

console.log("hello");

const nftContractAddress = "0x99512aaC7F817D29fF69245EB39A16B7C43e85b7";

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth-mainnet.g.alchemy.com/v2/HjGhos8RpYpliqdnBR5cbaf5mNO2hSBX"
);
let nftContract = new ethers.Contract(nftContractAddress, abi, provider);

let owners = [];

async function load() {
  const totalSupply = await nftContract.totalSupply();
  console.log(Number(totalSupply));
  for (let i = 1; i <= 1029; i++) {
    let owner = await nftContract.ownerOf(i);
    owners[i-1] = owner;
    console.log(i);
  }
  console.log(owners);
  var file = fs.createWriteStream("array.txt");
  file.on("error", function (err) {
    /* error handling */
  });
  owners.forEach(function (v) {
    file.write( '"' + v + '"' + ",\n");
  });
  file.end();
}

load();
