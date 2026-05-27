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
import {
    buildVersionedUserProfile,
    migrateUserProfileIfNeeded,
} from "../migrations/cloudMigrations";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
            if (user?.uid) {
                void migrateUserProfileIfNeeded(user.uid).catch((err) => {
                    console.warn("[migrations] user profile migration failed:", err);
                });
            }
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

    const saveUserProfile = async (uid, profile) => {
        const versioned = await buildVersionedUserProfile(uid, profile);
        await set(ref(db, `users/${uid}`), versioned);
    };

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
