import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    linkWithCredential,
    onAuthStateChanged,
    reauthenticateWithCredential,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email, password) =>
        signInWithEmailAndPassword(auth, email, password);

    const loginAnonymously = () => signInAnonymously(auth);

    const register = (email, password) =>
        currentUser?.isAnonymous
            ? linkWithCredential(currentUser, EmailAuthProvider.credential(email, password))
            : createUserWithEmailAndPassword(auth, email, password);

    const saveUserProfile = (uid, profile) =>
        set(ref(db, `users/${uid}`), profile);

    const getUserProfile = async (uid) => {
        const snapshot = await get(ref(db, `users/${uid}`));
        return snapshot.val();
    };

    const changePassword = async (currentPassword, newPassword) => {
        const credential = EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
    };

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ currentUser, loading, login, loginAnonymously, logout, register, saveUserProfile, getUserProfile, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
