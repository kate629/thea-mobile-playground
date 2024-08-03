import React, { useState } from "react";
import { Form, Field } from "react-final-form";
import { db } from "../../firebaseConfig";
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
        <div className="container mt-5">
            <h1>Welcome to Thea!</h1>
            <h2>{user?.displayName}</h2>
            <Form
                onSubmit={onSubmit}
                render={({ handleSubmit, form, submitting, pristine }) => (
                    <form onSubmit={handleSubmit} className="mt-4">
                        <div className="form-group">
                            <label>First Name</label>
                            <Field
                                name="firstName"
                                component="input"
                                type="text"
                                placeholder="First Name"
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <Field
                                name="lastName"
                                component="input"
                                type="text"
                                placeholder="Last Name"
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
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
