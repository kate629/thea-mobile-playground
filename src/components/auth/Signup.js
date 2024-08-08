import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import { Container } from "react-bootstrap";
import { useUserAuth } from "../../context/UserAuthContext.js";
import BrandedAuthButton from "./BrandedAuthButton.tsx";
import HeroComponent from "../common/HeroComponent.tsx";
import GoogleButton from "react-google-button";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const { logIn, googleSignIn } = useUserAuth();
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

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      await googleSignIn();
      navigate("/home");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <Container style={{ width: "70%", maxWidth: "400px" }}>
      <div className="p-4 box">
        <HeroComponent />
        <br />
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-center">
            <GoogleButton
              className="g-btn"
              type="dark"
              onClick={handleGoogleSignIn}
            />
          </div>
          <br />
          <p
            className="d-flex justify-content-center"
            style={{ fontFamily: "'Nunito Sans', sans-serif" }}
          >
            or
          </p>
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
      <div
        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
        className="p-4 box mt-3 text-center"
      >
        Already have an account? <Link to="/">Log In</Link>
      </div>
    </Container>
  );
};

export default Signup;
