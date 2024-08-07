import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import { Container } from "react-bootstrap";
import { useUserAuth } from "../../context/UserAuthContext.js";
import { RoundImage } from "../common/RoundImage.tsx";
import BrandedAuthButton from "./BrandedAuthButton.tsx";
import theaLogo from "../../assets/logo/thea_logo.png";
import HeroComponent from "../common/HeroComponent.tsx";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useUserAuth();
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signUp(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container style={{ width: "70%", maxWidth: "500px" }}>
      <div className="p-4 box">
        <HeroComponent />
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Control
              type="email"
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Control
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <BrandedAuthButton variant="primary" type="submit">
              Join
            </BrandedAuthButton>
          </div>
        </Form>
      </div>
      <div className="p-4 box mt-3 text-center">
        Already have an account? <Link to="/">Log In</Link>
      </div>
    </Container>
  );
};

export default Signup;
