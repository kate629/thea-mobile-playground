import React from "react";
import { Button, Container, Row, Col } from "react-bootstrap";

import { useNavigate } from "react-router";
import { useUserAuth } from "../context/UserAuthContext.tsx";
import UserOnboardingForm from "./onboarding/UserOnboardingForm.tsx";
import RoundImage from "./common/RoundImage.tsx";

const Home = () => {
  const { logOut, user } = useUserAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  console.log("User in Home: ", user);

  const photo = user?.photoURL;

  return (
    <Container fluid className="mt-5">
      <Row className="justify-content-center">
        <div className="p-4 box mt-3">
          <RoundImage image={photo} />
          <UserOnboardingForm />
        </div>
        <div className="d-grid gap-2 mt-3">
          <Button variant="primary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </Row>
    </Container>
  );
};

export default Home;
