'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

export function initiateAnonymousSignIn(authInstance: Auth): void {
  import('firebase/auth').then(({ signInAnonymously }) => {
    signInAnonymously(authInstance);
  });
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      updateProfile(userCredential.user, { displayName: displayName.trim() });
    })
    .catch((error) => {
      console.error("Signup error:", error);
    });
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

