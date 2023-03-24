import React from 'react';
import four from '../../Assets/404.gif'
import Navbar from '../Navbar';

const Four = () => {
    return (
        <div className='max-w-[1700px] mx-auto'>
            <div className="content w-full">
                <div className="img mx-auto">
                    <img src={four} className='block mx-auto' alt="404" />
                </div>
            </div>
        </div>
    );
};

export default Four;