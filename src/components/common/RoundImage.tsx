import React from "react";

interface Props {
  image: string;
}

export const RoundImage: React.FC<Props> = ({ image }) => {
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