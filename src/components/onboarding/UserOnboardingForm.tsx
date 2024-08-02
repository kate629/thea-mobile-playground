import React from "react";
import { Form, Field } from "react-final-form";
import { db } from "../../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

interface Props {
    name: string;
}

const UserOnboardingForm: React.FC<Props> = ({ name }) => {
    const auth = getAuth();
    const [user, setUser] = React.useState<User | null >(null);

    React.useEffect(() => {
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
        });
    }, [auth]);

    const countryCodes: { [key: string]: string } = {
        US: "+1",
        CA: "+1",
        IN: "+91",
        // Add more country codes as needed
    };

    const onSubmit = async (values: any) => {
        if (!user) {
            console.error("User is not authenticated");
            return;
        }

        try {
            await addDoc(collection(db, "users"), {
                firstName: values.firstName,
                lastName: values.lastName,
                gender: values.gender,
                birthday: new Date(values.dob),
                phoneNumber: {
                    countryCode: countryCodes[values.countryCode] || values.countryCode,
                    number: values.phoneNumber,
                },
                likes: values.likes.split(',').map((like: string) => like.trim()),
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
                            />
                        </div>
                        <div className="form-group">
                            <Field
                                name="lastName"
                                component="input"
                                type="text"
                                placeholder="Last Name"
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <Field name="gender" component="select" className="form-control">
                                <option value="">Select Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </Field>
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <Field
                                name="dob"
                                component="input"
                                type="date"
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="d-flex">
                                <Field
                                    name="countryCode"
                                    component="input"
                                    type="text"
                                    placeholder="Country Code (e.g., US, CA, IN)"
                                    className="form-control mr-2"
                                />
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
                            <label>Likes (comma separated)</label>
                            <Field
                                name="likes"
                                component="input"
                                type="text"
                                placeholder="Likes"
                                className="form-control"
                            />
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
    );
};

export default UserOnboardingForm;
