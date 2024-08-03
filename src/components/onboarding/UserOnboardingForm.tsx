import React, { useState } from "react";
import { Form, Field } from "react-final-form";
import { db } from "../../firebaseConfig";
import { Container } from "react-bootstrap";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

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

const required = (value: any) => (value ? undefined : "Required");
const emailValidation = (value: any) =>
    value && /\S+@\S+\.\S+/.test(value) ? undefined : "Invalid email";
const composeValidators = (...validators: any) => (value: any) =>
    validators.reduce((error, validator) => error || validator(value), undefined);

const UserOnboardingForm: React.FC<Props> = ({ name }) => {
    const auth = getAuth();
    
    const [user, setUser] = React.useState<User | null >(auth.currentUser);
    const [selectedLikes, setSelectedLikes] = useState<string[]>([]);

    React.useEffect(() => {
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
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
            await addDoc(collection(db, "user"), {
                firstName: values.firstName,
                lastName: values.lastName,
                gender: values.gender,
                birthday: new Date(values.dob),
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
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    return (
        <Container style={{ width: "50%" }}>
            <div className="container mt-5">
                <h1>Welcome to Thea!</h1>
                <h2>{user?.displayName}</h2>
                <Form
                    onSubmit={onSubmit}
                    render={({ handleSubmit, form, submitting, pristine }) => (
                        <form onSubmit={handleSubmit} className="mt-4">
                            <div className="form-group">
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
                                            <label>First Name</label>
                                            <input {...input} className="form-control" />
                                            {meta.error && meta.touched && (
                                                <span className="text-danger">{meta.error}</span>
                                            )}
                                        </div>
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
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
                                            <label>Last Name</label>
                                            <input {...input} className="form-control" />
                                            {meta.error && meta.touched && (
                                                <span className="text-danger">{meta.error}</span>
                                            )}
                                        </div>
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <Field name="gender" component="select" className="form-control" validate={required}>
                                    <option value="">Select Gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </Field>
                                <Field name="gender">
                                    {({ meta }) => meta.error && meta.touched && <span className="text-danger">{meta.error}</span>}
                                </Field>
                            </div>
                            <div className="form-group">
                                <Field
                                    name="dob"
                                    component="input"
                                    type="date"
                                    className="form-control"
                                    validate={required}
                                >
                                    {({ input, meta }) => (
                                        <div>
                                            <label>Date of Birth</label>
                                            <input {...input} className="form-control" />
                                            {meta.error && meta.touched && (
                                                <span className="text-danger">{meta.error}</span>
                                            )}
                                        </div>
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <div className="d-flex">
                                    <Field name="countryCode" component="select" className="form-control mr-2">
                                        <option value="">Select Country Code</option>
                                        {Object.entries(CountryCodes).map(([key, value]) => (
                                            <option key={key} value={value}>{`${key} (${value})`}</option>
                                        ))}
                                    </Field>
                                    <Field
                                        name="phoneNumber"
                                        component="input"
                                        type="text"
                                        placeholder="Phone Number"
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Likes</label>
                                <div>
                                    {likesOptions.map((like) => (
                                        <button
                                            key={like}
                                            type="button"
                                            className={`btn btn-outline-primary m-1 ${selectedLikes.includes(like) ? 'active' : ''}`}
                                            onClick={() => toggleLike(like)}
                                        >
                                            {like}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group form-check">
                                <Field
                                    name="terms"
                                    component="input"
                                    type="checkbox"
                                    className="form-check-input"
                                />
                                <label className="form-check-label">
                                    Acknowledge Terms and Conditions
                                    By checking this box, you acknowledge that you have read, understood, and agree to be bound by the terms of the
                                    <a href="https://givethea.com/version-test/confidentiality_agreement" target="_blank" rel="noreferrer">
                                        Terms and Conditions
                                    </a>
                                </label>
                            </div>
                            <div className="buttons">
                                <button type="submit" className="btn btn-primary" disabled={submitting || pristine}>
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary ml-2"
                                    onClick={form.reset}
                                    disabled={submitting || pristine}
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    )}
                />
            </div>
        </Container>
    );
};

export default UserOnboardingForm;
