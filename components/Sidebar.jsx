import React from "react";
import { imgPath } from "../utils/utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sidebar = () => {
  const handleFeature = () => {
    toast.info("This feature is not available as of now.");
  };

  return (
    <div className="w-64 h-screen bg-white flex flex-col gap-5 py-7 px-5 border-r border-[#E0E0E0]">
      <div className="flex flex-col justify-center gap-5">
        <div className="flex flex-row items-center gap-5 justify-start w-full hover:cursor-pointer">
          <img src={imgPath("vector.svg")} className="" alt="Auxo" />
          <div className="text-lg text-[#001E96] font-inter font-normal">
            HCP 360
          </div>
        </div>
        <hr />
      </div>
      <div className="flex flex-col text-[#008CE3] text-sm gap-2.5 absolute bottom-8 left-0 pt-4 ml-4">
        <div
          className="flex flex-row gap-2.5 items-center cursor-pointer"
          onClick={() => handleFeature()}
        >
          <img src={imgPath("download.svg")} alt="down" />
          <span className="capitalize">Download Chat</span>
        </div>
        <div
          className="flex flex-row gap-2.5 items-center cursor-pointer"
          onClick={() => handleFeature()}
        >
          <img src={imgPath("question.svg")} alt="help" />
          <span className="capitalize">Help</span>
        </div>
        <div
          className="flex flex-row gap-2.5 items-center cursor-pointer"
          onClick={() => handleFeature()}
        >
          <img src={imgPath("settings.svg")} alt="setting" />
          <span className="capitalize">Settings</span>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Sidebar;
