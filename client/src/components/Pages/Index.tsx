import React from 'react'
import Navbar from './Navbar';
import Hero from './Hero';
import CallToAction from './CallToAction';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Features from '../components/Features';
import About from '../components/About';
import Requirement from '../components/Requirement';
import NewsletterSection from '../components/Newsletter';
import Quotes from '../components/Quotes';
import '../../css/App.scss';


const HomePage = () => {
  return (
        <>
          <Header />
          <Footer/>
        </>
  );
}

export default HomePage;