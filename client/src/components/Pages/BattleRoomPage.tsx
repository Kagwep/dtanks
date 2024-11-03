import React from 'react'
import Navbar from '../components/Navbar';
import '../../css/App.scss';
import Footer from '../components/Footer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import { battleRooms } from '../../data/battleRoomData';
import BattleRoomList from '../components/BattleRoom';


const BattleRoomPage = () => {
  return (
    <div>
    <Navbar />
      <BattleRoomList rooms={battleRooms}/>
    <Footer />
</div>
  )
}

export default BattleRoomPage