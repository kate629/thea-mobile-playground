import React from "react";
import { Container, Row } from "react-bootstrap";

import UserOnboardingForm from "./onboarding/UserOnboardingForm.tsx";

const Home = () => {
  return (
    <Container className="mt-2">
      <Row className="justify-content-center">
        <div className="p-4 box">
          {/* {isValidPhotos ? <RoundImage image={photo} /> : <RoundImage />} */}
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
