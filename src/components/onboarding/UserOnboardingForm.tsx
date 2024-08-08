import React, { useEffect, useState } from "react";
import { Form, Field } from "react-final-form";
import { db } from "../../firebaseConfig";
import { Container, Button, Row, Col } from "react-bootstrap";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import BrandedAuthButton from "../auth/BrandedAuthButton";

interface Props {
    name: string;
}

enum CountryCodes {
    US = "+1",
    CA = "+1",
}

const likesOptions = [
    'Tech',
    'Books',
    'Cooking',
    'Jewelry',
    'Experiences', 
    'Plants', 
    'Fitness', 
    'Cocktails', 
    'Clothes', 
]; 

const DB_NAME = "user";

const required = (value: any) => (value ? undefined : "Required");
const emailValidation = (value: any) =>
    value && /\S+@\S+\.\S+/.test(value) ? undefined : "Invalid email";
const composeValidators = (...validators: any) => (value: any) =>
    validators.reduce((error: any, validator: any) => error || validator(value), undefined);

const UserOnboardingForm: React.FC<Props> = ({ name }) => {
    const auth = getAuth();
    const [user, setUser] = useState<User | null >(auth.currentUser);
    const [selectedLikes, setSelectedLikes] = useState<string[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const userAuthPhoneNumber = user?.phoneNumber;

    useEffect(() => {
        const checkSubscriptionStatus = async (currentUser: User) => {
            const q = query(collection(db, DB_NAME), where("uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setIsSubscribed(true);
            }
        };

        onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await checkSubscriptionStatus(currentUser);
            } else {
                setUser(null);
            }
        });
    }, [auth]);

    const toggleLike = (like: string) => {
        setSelectedLikes((prev) =>
            prev.includes(like) ? prev.filter((l) => l !== like) : [...prev, like]
        );
    };

    const onSubmit = async (values: any) => {
        if (!user) {
            console.error("User is not authenticated");
            return;
        }

        try {
            await addDoc(collection(db, DB_NAME), {
                firstName: values.firstName,
                lastName: values.lastName,
                gender: values.gender,
                birthday: new Date(values.dob),
                email: values.email,
                phoneNumber: {
                    countryCode: values.countryCode,
                    number: values.phoneNumber,
                },
                likes: selectedLikes,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                uid: user.uid,
            });
            console.log("Form submitted:", values);
            setIsSubscribed(true);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    if (isSubscribed) {
        console.log(user)
        return (
            <Container className="mt-5 text-center">
                <h1>{user?.displayName}, </h1>
                <h1>Thank you for subscribing to Thea!</h1>
                <p>We appreciate your interest. We'll be in touch soon.</p>
            </Container>
        );
    }

    return (
        <Container className="d-flex justify-content-center align-items-center mt-5" style={{ width: "70%", maxWidth: "500px" }}>
            <div className="w-90" >
            <h2 className="text-center" style={{ 
                    fontFamily: "'Nunito Sans', sans-serif", 
                    fontWeight: 400, 
                    fontSize: '30px', 
                    lineHeight: '40.92px', 
                    textAlign: 'center' 
                }}>
                    Welcome to the 
                    <br></br>
                    Thea pilot!
            </h2>
            <p className="text-center" style={{ 
                    fontFamily: "'Nunito Sans', sans-serif", 
                    fontWeight: 400, 
                    fontSize: '18px', 
                    lineHeight: '24.55px', 
                    marginTop: '20px'
                }}>
                Tell us a little more about yourself to get started.
            </p>
            
                <Form
                    onSubmit={onSubmit}
                    render={({ handleSubmit, form, submitting, pristine }) => (
                        <form onSubmit={handleSubmit} className="mt-4">
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={3} ><label>First Name</label></Col>
                                <Col sm={9}>
                                    <Field
                                        name="firstName"
                                        component="input"
                                        type="text"
                                        placeholder="First Name"
                                        className="form-control"
                                        validate={required}
                                    >
                                        {({ input, meta }) => (
                                            <div>
                                                <input {...input} className="form-control" />
                                                {meta.error && meta.touched && (
                                                    <span className="text-danger">{meta.error}</span>
                                                )}
                                            </div>
                                        )}
                                    </Field>
                                </Col>
                            </Row>
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={3} ><label>Last Name</label></Col>
                                <Col sm={9}>
                                    <Field
                                        name="lastName"
                                        component="input"
                                        type="text"
                                        placeholder="Last Name"
                                        className="form-control"
                                        validate={required}
                                    >
                                        {({ input, meta }) => (
                                            <div>
                                                <input {...input} className="form-control" />
                                                {meta.error && meta.touched && (
                                                    <span className="text-danger">{meta.error}</span>
                                                )}
                                            </div>
                                        )}
                                    </Field>
                                </Col>
                            </Row>
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={3} ><label>Gender</label></Col>
                                <Col sm={9}>
                                    <Field name="gender" component="select" className="form-control" validate={required}>
                                        <option value="">Select Gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </Field>
                                    <Field name="gender">
                                        {({ meta }) => meta.error && meta.touched && <span className="text-danger">{meta.error}</span>}
                                    </Field>
                                </Col>
                            </Row>
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={3}><label>Date of Birth</label></Col>
                                <Col sm={9}>
                                    <Field
                                        name="dob"
                                        component="input"
                                        type="date"
                                        className="form-control"
                                        validate={required}
                                    >
                                        {({ input, meta }) => (
                                            <div>
                                                <input {...input} className="form-control" />
                                                {meta.error && meta.touched && (
                                                    <span className="text-danger">{meta.error}</span>
                                                )}
                                            </div>
                                        )}
                                    </Field>
                                </Col>
                            </Row>
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={3}><label>Email</label></Col>
                                <Col sm={9}>
                                    <Field
                                        name="email"
                                        component="input"
                                        type="email"
                                        placeholder="Email"
                                        defaultValue={user?.email ?? ""}
                                        className="form-control"
                                        validate={composeValidators(required, emailValidation)}
                                    >
                                        {({ input, meta }) => (
                                            <div>
                                                <input {...input} className="form-control" />
                                                {meta.error && meta.touched && (
                                                    <span className="text-danger">{meta.error}</span>
                                                )}
                                            </div>
                                        )}
                                    </Field>
                                </Col>
                            </Row>
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={3}><label>Phone Number</label></Col>
                                <Col sm={9}>
                                    <div className="d-flex">
                                        <Field name="countryCode" component="select" className="form-control mr-2" style={{ width: '100px' }} defaultValue={CountryCodes.US}>
                                            <option value="">Country</option>
                                            {Object.entries(CountryCodes).map(([key, value]) => (
                                                <option key={key} value={value}>{`${key} (${value})`}</option>
                                            ))}
                                        </Field>
                                        <Field
                                            name="phoneNumber"
                                            component="input"
                                            type="text"
                                            placeholder={userAuthPhoneNumber ?? "Phone Number"}
                                            defaultValue={userAuthPhoneNumber ?? ""}
                                            className="form-control mr-2"
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <br />
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <label style={{ textAlign: 'center', display: 'block' }}>Help us help your friends! If a friend were picking out a gift for you, which categories would you be interested in?</label>
                                <div style={{ marginTop: '20px' }}>
                                    {likesOptions.map((like) => (
                                        <button
                                        key={like}
                                        type="button"
                                        className={`btn btn-outline-primary m-1 ${selectedLikes.includes(like) ? 'active' : ''}`}
                                        onClick={() => toggleLike(like)}
                                        style={{
                                            border: "1px solid black",
                                            backgroundColor: selectedLikes.includes(like) ? "#F8BD0080" : "transparent",
                                            color: "black",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#F8BD0080";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedLikes.includes(like)) {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                            }
                                        }}
                                    >
                                        {like}
                                    </button>
                                    ))}
                                </div>
                            </Row>
                            <hr />
                            <Row className="form-group mb-3 d-sm-flex align-items-sm-center">
                                <Col sm={1} className="text-sm-end">
                                    <Field
                                        name="terms"
                                        component="input"
                                        type="checkbox"
                                        className="form-check-input"
                                        validate={required}
                                    />
                                </Col>
                                <Col sm={11}>
                                    <label className="form-check-label small">
                                        By checking this box, you acknowledge that you have read, understood, and agree to be bound by our Confidentiality Agreement.{' '}
                                        <a href="https://givethea.com/version-test/confidentiality_agreement" target="_blank" rel="noreferrer">
                                            Confidentiality Agreement
                                        </a>
                                        <br />
                                        By signing up, you agree to receive text messages from Thea at the number provided. Msg freq may vary. Reply STOP to opt out. Std rates may apply.
                                    </label>
                                    <Field name="terms">
                                        {({ meta }) => meta.error && meta.touched && <span className="text-danger">{meta.error}</span>}
                                    </Field>
                                </Col>
                            </Row>
                            <br />
                            <div className="text-center">
                                <BrandedAuthButton type="submit" style={{ width: "60%", height: "50px" }} >
                                    Submit
                                </BrandedAuthButton>                                
                            </div>
                        </form>
                    )}
                />
            </div>
        </Container>
    );
};

export default UserOnboardingForm;
