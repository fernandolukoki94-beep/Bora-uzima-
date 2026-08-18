/**
 * Public Firebase Web App configuration for Fernando Lucoco Music.
 * This identifies the browser app; it is not an Admin SDK credential.
 */
export const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyCET99Iit8zSsdvqfwgniZ57buOEn19p6w",
  authDomain: "fernando-lucoco-music.firebaseapp.com",
  projectId: "fernando-lucoco-music",
  storageBucket: "fernando-lucoco-music.firebasestorage.app",
  messagingSenderId: "752137109139",
  appId: "1:752137109139:web:9afb9392bf5e0b42e59766",
  measurementId: "G-5E6KP9M31S",
});

export function isFirebaseConfigComplete(config = firebaseConfig) {
  return ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]
    .every((key) => typeof config[key] === "string" && config[key].trim().length > 0);
}
