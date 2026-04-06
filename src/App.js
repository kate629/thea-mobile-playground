import { Routes, Route } from "react-router-dom";

import { Container, Row, Col } from "react-bootstrap";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";

import CarouselFeedPage from "./components/carousel/CarouselFeedPage";
import FastCarouselFeedPage from "./components/carousel/FastCarouselFeedPage";
import { UserAuthContextProvider } from "./context/UserAuthContext.js";

function App() {
  return (
    <Container>
      <Row>
        <Col>
          <UserAuthContextProvider>
            <Routes>
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/feed" element={<CarouselFeedPage />} />
              <Route path="/feed-fast" element={<FastCarouselFeedPage />} />
            </Routes>
          </UserAuthContextProvider>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
