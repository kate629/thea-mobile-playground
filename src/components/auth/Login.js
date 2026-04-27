import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import { Container } from "react-bootstrap";
import GoogleButton from "react-google-button";
import { useUserAuth } from "../../context/UserAuthContext.js";
import BrandedAuthButton from "./BrandedAuthButton.tsx";
import HeroComponent from "../common/HeroComponent.tsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { logIn, googleSignIn } = useUserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await logIn(email, password);
      navigate("/home");
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
      // intentionally silent
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
              Log In
            </BrandedAuthButton>
          </div>
        </Form>
      </div>
      <div
        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
        className="p-4 box mt-3 text-center"
      >
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
    </Container>
  );
};

export default Login;
