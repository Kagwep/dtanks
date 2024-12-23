import React, { useState } from "react";
import { Button } from "../components/buttons/Button";
import { useElementStore } from "../../utils/dtanks";
import { useUiSounds, soundSelector } from "../../hooks/useUiSound";
import Intro from "../onboarding/Intro";
import { FaVolumeUp } from "react-icons/fa";
import { FaVolumeOff } from "react-icons/fa";



export type Section = "connect" | "eth" | "lords" | "arcade";

interface OnboardingProps {
  onOnboardComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({onOnboardComplete}) => {
  const isMuted = useElementStore((state) => state.isMuted);
  const setIsMuted = useElementStore((state) => state.setIsMuted);

  const { play: clickPlay } = useUiSounds(soundSelector.click);

  const [section, setSection] = useState<Section | undefined>();

  const setScreen = useElementStore((state) => state.setScreen);

  const network = useElementStore((state) => state.network);


  const { loginScreen } = useElementStore();

  return (
    <div className="min-h-screen bg-slate-800  flex flex-col items-center "  style={{
      backgroundImage: 'url("")',
      backgroundSize: 'cover',
     
    }} >
      <Button
        variant={"outline"}
        onClick={() => {
          setIsMuted(!isMuted);
          clickPlay();
        }}
        className="fixed top-1 left-1 sm:top-20 sm:left-20 xl:px-5"
      >
        {isMuted ? (
          <FaVolumeOff className="w-10 h-10 justify-center fill-current" />
        ) : (
          <FaVolumeUp className="w-10 h-10 justify-center fill-current" />
        )}
      </Button>
      <div className="flex flex-col items-center gap-5 py-20 sm:p-0">
          <Intro onOnboardComplete={onOnboardComplete}/>
      </div>
    </div>
  );
};

export default Onboarding;
