import "./Overview.css";
import React, { useState, useEffect, useRef } from "react";
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
import nft1 from "../../Assets/1.png";
import nft2 from "../../Assets/2.jpg";
import nft3 from "../../Assets/3.png";
import nft4 from "../../Assets/4.png";
import nft5 from "../../Assets/5.png";
import nft6 from "../../Assets/6.png";
import nft7 from "../../Assets/7.jpg";
import nft8 from "../../Assets/8.jpg";
import check from "../../Assets/authenticated.png";
import notauth from "../../Assets/unauthenticated.png";
import { add } from "lodash";

const featuredProducts = [nft1, nft2, nft3, nft4, nft5, nft6, nft7, nft8];

let Count = 0;
let slideInterval;

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

const Overview = ({ connected, addy }) => {
  const [totalMinted, setTotalMinted] = useState(0);
  const [totalMintedPercentage, setTotalMintedPercentage] = useState(0);
  const [count, setCount] = useState(1);
  const [price, setPrice] = useState("0.0005");
  const [priceWL, setPriceWL] = useState("0.00035");
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [isPublicMint, setIsPublicMint] = useState(false);
  const [maxCount, setMaxCount] = useState(15);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { address, isConnected } = useAccount();

  const slideRef = useRef();

  // const removeAnimation = () => {
  //   slideRef.current.classList.remove("fade-anim");
  // };

  useEffect(() => {
    // slideRef.current.addEventListener("animationend", removeAnimation);
    // slideRef.current.addEventListener("mouseenter", pauseSlider);
    // slideRef.current.addEventListener("mouseleave", startSlider);

    startSlider();
    return () => {
      pauseSlider();
    };
    // eslint-disable-next-line
  }, []);

  const startSlider = () => {
    slideInterval = setInterval(() => {
      handleOnNextClick();
    }, 1000);
  };

  const pauseSlider = () => {
    clearInterval(slideInterval);
  };

  const handleOnNextClick = () => {
    Count = (Count + 1) % featuredProducts.length;
    setCurrentIndex(Count);
  };

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

      let price = await contract.MINT_PRICE();
      setPrice(ethers.utils.formatEther(price));

      let priceWL = await contract.WHITELIST_PRICE();
      setPriceWL(ethers.utils.formatEther(priceWL));

      const maxpWallet = await contract.MAX_PER_WALLET();
      setMaxCount(Number(maxpWallet));
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

    let provider = new ethers.providers.Web3Provider(window.ethereum);
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
    // const provider = new ethers.providers.JsonRpcProvider(
    //   "https://eth-mainnet.g.alchemy.com/v2/_FZI1Fc3QS5MfpdSzCY5sEOuW0j1PzIO"
    // );

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

  // if (!connected) {
  //   return (
  //     <>
  //       <div className="center-screen bg-black">
  //         <div>
  //           <p className="text-white text-center">
  //             {" "}
  //             Please connect your wallet to proceed.
  //           </p>
  //           <div className="center">
  //             <WagmiConfig client={wagmiClient}>
  //               <RainbowKitProvider
  //                 appInfo={demoAppInfo}
  //                 chains={chains}
  //                 theme={darkTheme({
  //                   accentColor: "#20248E",
  //                   accentColorForeground: "white",
  //                   borderRadius: "small",
  //                   fontStack: "system",
  //                   overlayBlur: "small",
  //                 })}
  //               >
  //                 <ConnectButton label="Connect wallet" />
  //               </RainbowKitProvider>
  //             </WagmiConfig>
  //           </div>
  //         </div>
  //       </div>
  //     </>
  //   );
  // }

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
              {/* <div className="col-lg-6 col-md-6" style={{ fontSize: "20px" }}>
                <div
                  className="border-white border-1 p-3"
                  style={{ borderRadius: "15px" }}
                >
                  <h1 className="text-left text-2xl">
                    {" "}
                    {Number(totalMintedPercentage).toFixed(2)} %
                  </h1>
                  <span className="text-base font-light">
                    Fluff N' Stuff minted:{" "}
                  </span>
                  <ProgressBar progressPercentage={totalMintedPercentage} />
                </div>
                <div className="flex justify-between mt-3">
                  <span className="font-normal text-sm">Max: 4069</span>
                  <span className="font-normal text-sm">
                    Minted: {totalMinted}
                  </span>
                </div>
              </div> */}

              {/* NORMAL MINT */}
              <div className="col-lg-12 col-md-12 p-3">
                <div className="flex justify-center">
                  {/* <img src={imageSources[currentSourceIndex]} alt="My Image" /> */}
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
                      <figure>
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
                      </figure>
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
                  {/* NORMAL MINT END */}
                  {/* WL START */}
                  {isWhitelisted && (
                    // <div>
                    //   <div className="text-center desktop:py-2 mobile:py-3">
                    //     <button type="button">
                    //       <img
                    //         className="desktop:w-10 mobile:w-8"
                    //         onClick={handleMinus}
                    //         src={minus}
                    //         alt="minus"
                    //       />
                    //     </button>
                    //     <span className="font-bold text-white text-2xl ml-6 mb-3">
                    //       {count}
                    //     </span>
                    //      {" "}
                    //     <button type="button">
                    //       <img
                    //         className="desktop:w-10 mobile:w-8"
                    //         onClick={() => {
                    //           if (count < wlAmount) handleAdd();
                    //         }}
                    //         src={plus}
                    //         alt="plus"
                    //       />
                    //     </button>
                    //   </div>

                    //   <p className="text-center font-normal mb-2">
                    //     {count} Whitelist mint cost{" "}
                    //     {Number(priceWL * count).toFixed(4)}
                    //     <span className="font-bold"> ETH</span>
                    //   </p>

                    //   <button
                    //     type="button"
                    //     onClick={handleWLMint}
                    //     className="font-normal text-center desktop:text-l mobile:text-base text-white border-1 border-purple bg-purple hover:bg-transparent rounded-lg bg-purple mt-3 desktop:px-3 desktop:py-2 mobile:px-2 mobile:py-1"
                    //     style={{ margin: "0 auto", display: "block" }}
                    //   >
                    //     MINT{" "}
                    //   </button>
                    // </div>
                    <div className="card card-compact w-72 bg-transparent shadow-xl">
                      <figure>
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
                      </figure>
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
                              {Number(count * priceWL).toFixed(5)} ETH
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
                            className="btn btn-primary"
                            onClick={handleWLMint}
                          >
                            Mint Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* WL END */}
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
