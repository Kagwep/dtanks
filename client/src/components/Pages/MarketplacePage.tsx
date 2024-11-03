import React from 'react'
import Navbar from '../components/Navbar';
import '../../css/App.scss';
import ProfileHeader from '../components/ProfileHeader';
import Footer from '../components/Footer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import MarketplaceHero from '../components/MarketplaceHero';
import Steps from '../components/Steps/Steps';
import CTA from '../components/CTA/CTA';
import Banners from '../components/Banners/Banners';

const MarketplacePage = () => {
  return (
    <div>
        <Navbar />
           < MarketplaceHero />
           <Steps /> 
           {/* <Banners /> */}
           <CTA />
        <Footer />
    </div>
  )
}

export default MarketplacePage