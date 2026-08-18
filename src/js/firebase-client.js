// Firebase Web SDK client for Fernando Lucoco Music.
// These values identify the public Web App. They are not Admin SDK credentials.
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function configureAuthPersistence() {
  await setPersistence(auth, browserLocalPersistence);
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email, password, displayName = "") {
  await configureAuthPersistence();
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credentials.user, displayName);
  return credentials.user;
}

export async function loginWithEmail(email, password) {
  await configureAuthPersistence();
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credentials.user);
  return credentials.user;
}

export async function loginWithGoogle() {
  await configureAuthPersistence();
  const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureUserProfile(credentials.user, credentials.user.displayName || "");
  return credentials.user;
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}

export async function ensureUserProfile(user, displayName = "") {
  if (!user?.uid) throw new Error("Utilizador Firebase inválido.");
  const profileRef = doc(collection(db, "users"), user.uid);
  await setDoc(profileRef, {
    displayName: displayName.trim() || user.displayName || user.email?.split("@")[0] || "Artista",
    email: user.email || "",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
  return profileRef;
}

export function firebaseErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Este e-mail já tem uma conta.",
    "auth/invalid-email": "O e-mail não é válido.",
    "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou palavra-passe incorrectos.",
    "auth/user-not-found": "E-mail ou palavra-passe incorrectos.",
    "auth/wrong-password": "E-mail ou palavra-passe incorrectos.",
    "auth/too-many-requests": "Foram feitas demasiadas tentativas. Tenta novamente mais tarde.",
    "permission-denied": "O Firebase recusou o acesso. Verifica as regras do Firestore.",
  };
  return messages[error?.code] || error?.message || "Não foi possível concluir a operação Firebase.";
}
