import AOS from 'aos';
import 'aos/dist/aos.css';
import {useEffect } from "react"
import { Route, Routes } from "react-router-dom"
import Footer from "./Components/Footer/Footer"
import Four from './Components/FourOFour/Four';
import HomePage from "./Pages/HomePage"




function App() {

	useEffect(() => {
		AOS.init(
			{
				duration: 1000,
				easing: 'ease',
				once: true,
				mirror: false,
			}
		);
	}, [])


	return (

		<div className=''>

			<Routes>

				<Route path={'/'} element={<HomePage />} />
				<Route path={'*'} element={<Four />} />

			</Routes>

		</div>


	)
}

export default App
