import "./Overview.css";
import React, { useState, useEffect } from "react";
import { BigNumber, ethers } from "ethers";
import { nftContractAddress, whitelistAddresses } from "../Config/Config";
import { useAccount } from "wagmi";

import Navbar from "../Navbar.js";
import Footer from "../Footer/Footer.js";
import Swal from "sweetalert2";
import plus from "../../Assets/plus.png";
import minus from "../../Assets/minus.png";
import "@rainbow-me/rainbowkit/styles.css";
import bgVideo from "../../Assets/bg-vid.mp4";
import check from "../../Assets/authenticated.png";
import notauth from "../../Assets/unauthenticated.png";

const nftERC721ABI = require("../ABI/abi.json");

const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
const merkleTreeWL = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHashWL = merkleTreeWL.getRoot();
console.log("Whitelist Roothash: " + "0x" + buf2hex(rootHashWL));

const ProgressBar = ({ progressPercentage }) => {
  return (
    <div className="h-3 w-full bg-white" style={{ borderRadius: "15px" }}>
      <div
        style={{ width: `${progressPercentage}%`, borderRadius: "15px" }}
        className={`h-full ${
          progressPercentage < 70 ? "bg-purple" : "bg-purple"
        }`}
      ></div>
    </div>
  );
};

const Overview = ({ addy }) => {
  const [totalMinted, setTotalMinted] = useState(0);
  const [totalMintedPercentage, setTotalMintedPercentage] = useState(0);
  const [count, setCount] = useState(1);
  const price = "0.007";
  const priceWL = "0.005";
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isPublicMint, setIsPublicMint] = useState(false);
  const maxCount = 5;
  const maxCountWL = 2;
  const { address, isConnected } = useAccount();

  const showAlerts = (alert, message, title = "") => {
    switch (alert) {
      case "success":
        Swal.fire({
          position: "center",
          icon: "success",
          title: title,
          text: message,
          showConfirmButton: false,
          timer: 1500,
          background: "#0b1225",
        });
        break;
      case "error":
        Swal.fire({
          icon: "error",
          toast: true,
          title: title,
          text: message,
          background: "#0b1225",
        });
        break;
      case "warning":
        Swal.fire({
          icon: "warning",
          title: title,
          text: message,
          background: "#0b1225",
        });
        break;
      default:
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      async function legacy() {
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        let signer = provider.getSigner(addy);
        let Contract = new ethers.Contract(
          nftContractAddress,
          nftERC721ABI,
          signer
        );
        const claimingAddress = keccak256(addy);
        const WLstatus = await Contract.WL_MINT_STATUS();
        const wlamount = await Contract.WHITELIST_AMOUNT();
        const WLAmount = Number(wlamount);

        const WLclaimed = await Contract.whitelistClaimed(addy);
        const WLclaimedNo = Number(WLclaimed);

        const hexProof = merkleTreeWL.getHexProof(claimingAddress);
        const isWL = merkleTreeWL.verify(hexProof, claimingAddress, rootHashWL);

        if (WLstatus && isWL && WLclaimedNo < WLAmount) {
          setIsWhitelisted(true);
        }
      }
      legacy();
    }
  }, [isConnected, address]);

  useEffect(() => {
    async function loadData() {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_ProviderLink
      );
      let contract = new ethers.Contract(
        nftContractAddress,
        nftERC721ABI,
        provider
      );

      let pubmint = await contract.PUBLIC_MINT_STATUS();
      setIsPublicMint(pubmint);

      let Minted = await contract.totalSupply();
      let total = Number(Minted);
      setTotalMinted(total.toString());
      setTotalMintedPercentage((total / 4069) * 100);
    }
    loadData();
  }, []);

  const handleAdd = () => {
    setCount(count + 1);
  };

  const handleMinus = () => {
    setCount(count - 1);
  };

  const handleWLMint = async () => {
    const claimingAddress = keccak256(addy);
    const hexProof = merkleTreeWL.getHexProof(claimingAddress);
    console.log(hexProof);
    console.log(merkleTreeWL.verify(hexProof, claimingAddress, rootHashWL));

    // let provider = new ethers.providers.Web3Provider(window.ethereum);
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_ProviderLink
    );
    let signer = provider.getSigner(addy);
    let contract = new ethers.Contract(
      nftContractAddress,
      nftERC721ABI,
      signer
    );
    try {
      if (!isConnected) {
        showAlerts("error", `Connect your wallet to mint`, "Connect Wallet");
      }
      const wlpr = ethers.utils.parseEther((priceWL * count).toString());
      console.log(wlpr.toString());
      const response = await contract.whitelistMint(hexProof, count, {
        value: BigNumber.from(
          ethers.utils.parseEther((priceWL * count).toString())
        ),
      });

      await provider.waitForTransaction(response.hash);
      showAlerts("success", `Sucessfully Minted ${count} Naisho`, "Success");
    } catch (err) {
      if (!isConnected) {
        showAlerts("error", `Connect your wallet to mint`, "Connect Wallet");
      } else {
        console.log(err);
        let message = err.reason;
        console.log(message);
        showAlerts("error", message, "Fail");
      }
    }
  };

  const handleMint = async () => {
    let provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    let signer = provider.getSigner(addy);
    console.log(signer);

    let contract = new ethers.Contract(
      nftContractAddress,
      nftERC721ABI,
      signer
    );

    let mintAmount = count;

    let value = mintAmount * Number(price);

    try {
      const response = await contract.mint(count, {
        value: BigNumber.from(ethers.utils.parseEther(value.toString())),
      });
      await provider.waitForTransaction(response.hash);
      showAlerts("success", `Sucessfully Minted ${count} Naisho`, "Success");
    } catch (err) {
      if (!isConnected) {
        showAlerts("error", `Connect your wallet to mint`, "Connect Wallet");
      } else {
        console.log(err);
        let message = err.reason;
        console.log(message);
        showAlerts("error", message, "Fail");
      }
    }
  };

  return (
    <div className="bgclass min-h-screen flex flex-col">
      <video
        className="absolute inset-0 object-cover object-top w-full h-full"
        autoPlay
        muted
        loop
      >
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="text-white relative flex flex-grow" id="overview">
        <div className="desktop:px-24 laptop:px-24 mobile:px-4 mx-auto">
          <Navbar />
          <div
            className="flex laptop:flex-row desktop:flex-row mobile:flex-col justify-center items-center"
            data-aos="fade-left"
          >
            <div
              className="row glasseffect border-1 border-deepDarkBg font-semibold p-2"
              style={{ borderRadius: "10px" }}
            >
              <div className="glasseffecttop py-3 my-3 bannerText">
                <h1 className="text-white text-center desktop:text-2xl laptop:text-2xl mobile:text-xl font-semibold pb-2">
                  Behind the Ethereal veil, we are Project Naisho 内緒.
                </h1>
              </div>

              <div className="col-lg-12 col-md-12 p-3">
                <div className="flex justify-center">
                  {isPublicMint && !isWhitelisted && (
                    // <div>
                    //   <div className="text-center desktop:py-2 mobile:py-3 flex justify-center">
                    //     <button type="button">
                    //       <img
                    //         className="desktop:w-10 mobile:w-8"
                    //         onClick={handleMinus}
                    //         src={minus}
                    //         alt="minus"
                    //       />
                    //     </button>
                    //     <p className="font-bold text-white text-2xl my-auto px-3">
                    //       {count}
                    //     </p>

                    //     <button type="button">
                    //       <img
                    //         className="desktop:w-10 mobile:w-8"
                    //         onClick={() => {
                    //           if (count < maxCount) {
                    //             handleAdd();
                    //           }
                    //         }}
                    //         src={plus}
                    //         alt="plus"
                    //       />
                    //     </button>
                    //   </div>

                    //   <p className="text-center font-normal mb-2">
                    //     {" "}
                    //     <span className="bg-mediumGray p-2 rounded-xl">
                    //       Mint Price
                    //     </span>{" "}
                    //     {Number(count * price).toFixed(3)} ETH
                    //   </p>

                    //   <button
                    //     type="button"
                    //     onClick={handleMint}
                    //     className="font-normal text-center desktop:text-l mobile:text-base text-white border-1 border-purple bg-purple hover:bg-transparent rounded-lg bg-purple mt-3 desktop:px-3 desktop:py-2 mobile:px-2 mobile:py-1"
                    //     style={{ margin: "0 auto", display: "block" }}
                    //   >
                    //     MINT{" "}
                    //   </button>
                    // </div>
                    <div className="card card-compact w-72 glasseffectMint shadow-xl">
                      {/* <figure>
                        <div
                          ref={slideRef}
                          className="select-none relative mx-auto my-auto mb-4"
                        >
                          <div className="flex justify-center">
                            <img
                              className="border-1 border-black"
                              src={featuredProducts[currentIndex]}
                              alt="NFT"
                              // style={{ borderRadius: "15px", width: "20vh" }}
                            />
                          </div>
                        </div>
                      </figure> */}
                      <div className="card-body">
                        <h2 className="card-title">Project Naisho 内緒</h2>
                        <p>Mint Your Naisho 内緒</p>
                        <div className="font-normal my-2">
                          <p className="bg-[#20248E] px-2 py-1 rounded-xl mb-2">
                            Whitelisted
                            <img
                              src={notauth}
                              alt="check"
                              className="w-6 inline float-right"
                            />
                          </p>

                          <p className="bg-[#20248E] px-2 py-1 rounded-xl">
                            Price
                            <span className="float-right">
                              {Number(count * price).toFixed(4)} ETH
                            </span>
                          </p>
                        </div>
                        <div
                          className="col-lg-12 col-md-12"
                          style={{ fontSize: "20px" }}
                        >
                          <div
                            className=""
                            // style={{ borderRadius: "15px" }}
                          >
                            {/* <h1 className="text-left text-2xl">
                              {" "}
                              {Number(totalMintedPercentage).toFixed(2)} %
                            </h1> */}
                            <span className="text-sm font-light">
                              Naisho minted
                            </span>
                            <ProgressBar
                              progressPercentage={totalMintedPercentage}
                            />
                          </div>
                          <div className="flex justify-between mt-3">
                            <span className="font-normal text-sm">
                              Max: 4069
                            </span>
                            <span className="font-normal text-sm">
                              Minted: {totalMinted}
                            </span>
                          </div>
                        </div>
                        <div className="card-actions justify-between">
                          <div className="text-center desktop:py-2 mobile:py-3 flex justify-center">
                            <button type="button">
                              <img
                                className="desktop:w-8 mobile:w-8"
                                onClick={handleMinus}
                                src={minus}
                                alt="minus"
                              />
                            </button>
                            <p className="font-bold text-white text-2xl my-auto px-3">
                              {count}
                            </p>

                            <button type="button">
                              <img
                                className="desktop:w-8 mobile:w-8"
                                onClick={() => {
                                  if (count < maxCount) {
                                    handleAdd();
                                  }
                                }}
                                src={plus}
                                alt="plus"
                              />
                            </button>
                          </div>
                          <button
                            onClick={handleMint}
                            className="btn btn-primary"
                          >
                            Mint Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isWhitelisted && (
                    <div className="card card-compact w-72 bg-transparent shadow-xl">
                      <div className="card-body">
                        <h2 className="card-title">Project Naisho 内緒</h2>
                        <p>Mint Your Naisho 内緒</p>
                        <div className="font-normal my-2">
                          <p className="bg-[#20248E] px-2 py-1 rounded-xl mb-2">
                            Whitelisted
                            <img
                              src={check}
                              alt="check"
                              className="w-5 inline float-right"
                            />
                          </p>

                          <p className="bg-[#20248E] px-2 py-1 rounded-xl">
                            Price
                            <span className="float-right">
                              {Number(count * priceWL).toFixed(3)} ETH
                            </span>
                          </p>
                        </div>
                        <div
                          className="col-lg-12 col-md-12"
                          style={{ fontSize: "20px" }}
                        >
                          <div className="">
                            <span className="text-sm font-light">
                              Naisho minted
                            </span>
                            <ProgressBar
                              progressPercentage={totalMintedPercentage}
                            />
                          </div>
                          <div className="flex justify-between mt-3">
                            <span className="font-normal text-sm">
                              Max: 4069
                            </span>
                            <span className="font-normal text-sm">
                              Minted: {totalMinted}
                            </span>
                          </div>
                        </div>
                        <div className="card-actions justify-between">
                          <div className="text-center desktop:py-2 mobile:py-3 flex justify-center">
                            <button type="button">
                              <img
                                className="desktop:w-8 mobile:w-8"
                                onClick={handleMinus}
                                src={minus}
                                alt="minus"
                              />
                            </button>
                            <p className="font-bold text-white text-2xl my-auto px-3">
                              {count}
                            </p>

                            <button type="button">
                              <img
                                className="desktop:w-8 mobile:w-8"
                                onClick={() => {
                                  if (count < maxCountWL) {
                                    handleAdd();
                                  }
                                }}
                                src={plus}
                                alt="plus"
                              />
                            </button>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={handleWLMint}
                          >
                            Mint Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Overview;
