import React from "react";
import { Button, Container, Row, Col } from "react-bootstrap";

import { useNavigate } from "react-router";
import { useUserAuth } from "../context/UserAuthContext.js";
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
  const isValidPhotos = photo !== null && photo !== undefined;

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <div className="p-4 box mt-3">
          {isValidPhotos ? <RoundImage image={photo} /> : <RoundImage />}
          <UserOnboardingForm />
        </div>
      </Row>
      {/* <Row className="justify-content-center mt-3">
        <Col className="text-center">
          <Button variant="danger" onClick={handleLogout}>
            Log Out
          </Button>
        </Col>
      </Row> */}
    </Container>
  );
};

export default Home;
