import { Button } from "../components/buttons/Button";
import { useUiSounds, soundSelector } from "../../hooks/useUiSound"
import { useElementStore, Network } from "../../utils/dtanks";
import { FaVolumeUp, FaVolumeOff } from "react-icons/fa";

interface IntroProps {
  onOnboardComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({onOnboardComplete}) => {
  const {
    setLoginScreen,
    setScreen,
    handleOnboarded,
    setNetwork,
    setIsMuted,
    isMuted,
  } = useElementStore();

  const { play: clickPlay } = useUiSounds(soundSelector.click);


  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-green-900 to-green-950" style={{
      backgroundImage: 'url("")',
      backgroundSize: 'cover',
      backgroundBlendMode: 'overlay',
    }}>
      <Button
        variant={"outline"}
        onClick={() => {
          setIsMuted(!isMuted);
          clickPlay();
        }}
        className="fixed top-1 left-1 sm:top-20 sm:left-20 xl:px-5 bg-green-800 hover:bg-green-700 text-white border-green-600"
      >
        {isMuted ? (
          <FaVolumeOff className="w-10 h-10 justify-center fill-current" />
        ) : (
          <FaVolumeUp className="w-10 h-10 justify-center fill-current" />
        )}
      </Button>
      <div className="flex flex-col items-center gap-8 py-20 sm:p-0 my-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-6xl font-bold text-green-300 mb-10 tracking-wider">Dtanks</h1>
        <div className="flex flex-col sm:flex-row sm:mt-20 gap-8 justify-center items-stretch w-full">
          <div className="flex flex-col items-center justify-between rounded-lg overflow-hidden bg-green-800 bg-opacity-80 text-green-100 shadow-lg border border-green-600 w-full sm:w-1/2">
            <div className="w-full p-4 flex justify-center items-center bg-green-900">
              <img 
                src="https://res.cloudinary.com/dydj8hnhz/image/upload/v1730413962/j5hj0ewsdlfcmghtze6p.webp" 
                alt="Strategic Command Center" 
                className="w-full h-48 object-contain rounded"
              />
            </div>
            <div className="p-6 sm:p-8 text-center flex flex-col gap-6 flex-grow">
              <p className="sm:text-xl">
                Enter Dtanks using Cartridge Controller. Experience strategic gameplay with seamless wallet integration and enhanced security.
              </p>
              <Button
                size={"lg"}
                onClick={() => {
                  setLoginScreen(true);
                  setNetwork("slot" as Network);
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-md shadow-md transition-colors duration-300 mt-auto"
              >
                Play
              </Button>
            </div>
          </div>
          {/* <div className="flex flex-col items-center justify-between rounded-lg overflow-hidden bg-green-800 bg-opacity-80 text-green-100 shadow-lg border border-green-600 w-full sm:w-1/2">
            <div className="w-full p-4 flex justify-center items-center bg-green-900">
              <img 
                src="https://res.cloudinary.com/dydj8hnhz/image/upload/v1730413962/j5hj0ewsdlfcmghtze6p.webp" 
                alt="Virtual Warfare Simulation" 
                className="w-full h-48 object-contain rounded"
              />
            </div>
            <div className="p-6 sm:p-8 text-center flex flex-col gap-6 flex-grow">
              <p className="sm:text-xl">
                Train in a local environment with Katana. Perfect for testing strategies and developing tactics without network constraints.
              </p>
              <Button
                size={"lg"}
                onClick={() => {
                  setScreen("start");
                  handleOnboarded();
                  onOnboardComplete();
                  setNetwork("katana" as Network);
                  
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-md shadow-md transition-colors duration-300 mt-auto"
              >
                Play on Katana
              </Button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Intro;