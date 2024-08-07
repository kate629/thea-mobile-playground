import React from "react";
import thea_logo from "../../assets/logo/thea_logo.png";

interface Props {
  image: string;
}

export const RoundImage: React.FC<Props> = ({ image = thea_logo }) => {
  return (
    <div className="text-center mb-3">
      <img
        src={image}
        alt="Thea Logo"
        className="rounded-circle"
        style={{ width: "100px", height: "100px" }}
      />
    </div>
  );
};

export default RoundImage;