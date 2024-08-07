import React from 'react';
import { Button } from 'react-bootstrap';

interface BrandedAuthButtonProps {
  variant?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
  onClick?: () => void;
  children: React.ReactNode;
}

const BrandedAuthButton: React.FC<BrandedAuthButtonProps> = ({
  variant = "primary",
  type = "button",
  style = {},
  onClick,
  children
}) => {
  const defaultStyles: React.CSSProperties = {
    backgroundColor: "rgba(248, 189, 0, 0.5)",
    borderColor: "#000000",
    color: "#000000",
    fontWeight: 700, 
    ...style, 
  };

  return (
    <Button
      variant={variant}
      type={type}
      style={defaultStyles}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default BrandedAuthButton;