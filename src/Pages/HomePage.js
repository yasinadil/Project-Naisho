import React from 'react';
import Overview from '../Components/Overview/Overview';

import {
    useAccount,
  } from 'wagmi'

const HomePage = () => {
    const { address, isConnected } = useAccount()
    console.log(address + isConnected);
  
    
    return (
        <div className="WebContainer">
       
            {isConnected ? <Overview  connected={true} addy={address} /> : <Overview  connected={false}/>}

        </div>
    );
};

export default HomePage;