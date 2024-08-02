import React, { useEffect } from 'react';
import "firebase/compat/auth";
import firebase from 'firebase/compat/app';
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'

const AuthProvider = (props) => {
    useEffect(() => {
        const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(props.auth)
        ui.start('.firebase-auth-container', {
            signInFlow: 'popup',
            signInOptions: [
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                firebase.auth.EmailAuthProvider.PROVIDER_ID,
                firebase.auth.PhoneAuthProvider.PROVIDER_ID
            ],
            signInSuccessUrl: '/authenticated',
            privacyPolicyUrl: '/privacy'
        })
    }, [props.auth])
    return (
        <div className='firebase-auth-container'></div>
    );
};

export default AuthProvider;