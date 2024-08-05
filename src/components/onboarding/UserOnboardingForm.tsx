import React, { useEffect, useState } from "react";
import { Form, Field } from "react-final-form";
import { db } from "../../firebaseConfig";
import { Container, Button } from "react-bootstrap";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
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
        return (
            <Container className="mt-5">
                <h1>{user?.displayName}, </h1>
                <h1>Thank you for subscribing to Thea!</h1>
                <p>We appreciate your interest. We'll be in touch soon.</p>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
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
                            <Field
                                name="email"
                                component="input"
                                type="email"
                                placeholder="Email"
                                className="form-control"
                                validate={composeValidators(required, emailValidation)}
                            >
                                {({ input, meta }) => (
                                    <div>
                                        <label>Email</label>
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
                                    placeholder={userAuthPhoneNumber ?? "Phone Number"}
                                    defaultValue= {userAuthPhoneNumber ?? ""}
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Tell us about your interests: </label>
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
                        <hr />
                        <div className="form-group form-check">
                            <Field
                                name="terms"
                                component="input"
                                type="checkbox"
                                className="form-check-input"
                                validate={required}
                            />
                            <label className="form-check-label small">
                                By checking this box, you acknowledge that you have read, understood, and agree to be bound by our{' '}
                                <a href="https://givethea.com/version-test/confidentiality_agreement" target="_blank" rel="noreferrer">
                                    Terms and Conditions
                                </a>
                                <p>By signing up, you agree to receive text messages from Thea at the number provided. Msg freq may vary. Reply STOP to opt out. Std rates may apply.</p>
                            </label>
                            <Field name="terms">
                                {({ meta }) => meta.error && meta.touched && <span className="text-danger">{meta.error}</span>}
                            </Field>
                        </div>
                        <br />
                        <div className="text-center">
                            <Button type="submit" style={{ width: "50%" }} className="btn btn-primary" disabled={submitting || pristine}>
                                Submit
                            </Button>
                        </div>
                    </form>
                )}
            />
        </Container>
    );
};

export default UserOnboardingForm;
