import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6PDnP8hxIzx9h1RstTsQfVCdkXZAGrEg",
    authDomain: "clustr-afbdb.firebaseapp.com",
    projectId: "clustr-afbdb",
    storageBucket: "clustr-afbdb.firebasestorage.app",
    messagingSenderId: "299719938702",
    appId: "1:299719938702:web:9b2dcccfcfeb0587efafdf",
    measurementId: "G-DNYXPGJW0D"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');

const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');

const loginPasswordToggle = document.getElementById('loginPasswordToggle');
const signupPasswordToggle = document.getElementById('signupPasswordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

// Form switching
showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchToSignup();
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchToLogin();
});

// Password toggle functionality
function setupPasswordToggle(toggleBtn, passwordInput) {
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const icon = toggleBtn.querySelector('.show-text');
            icon.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
}

// Setup password toggles
setupPasswordToggle(loginPasswordToggle, document.getElementById('loginPassword'));
setupPasswordToggle(signupPasswordToggle, document.getElementById('signupPassword'));
setupPasswordToggle(confirmPasswordToggle, document.getElementById('confirmPassword'));

// Email validation functions
function isValidCollegeEmail(email) {
    const emailLower = email.toLowerCase();

    // Block Gmail and other common personal email providers
    const blockedDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
    ];

    const domain = emailLower.split('@')[1];
    if (blockedDomains.includes(domain)) {
        return false;
    }

    // Must contain .edu or other educational domains
    const educationalPatterns = [
        /\.edu$/,           // US educational institutions
        /\.ac\./,           // Academic institutions (international)
        /\.edu\./,          // Educational subdomains
        /university\./i,    // University domains
        /college\./i,       // College domains
        /school\./i         // School domains
    ];

    return educationalPatterns.some(pattern => pattern.test(domain));
}

function extractCollegeFromEmail(email) {
    const domain = email.split('@')[1];
    return domain.split('.')[0].replace(/[-_]/g, ' ').toUpperCase();
}

function switchToSignup() {
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
    hideMessages();
}

function switchToLogin() {
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
    hideMessages();
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess() {
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

// Login form handler
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    setButtonLoading(submitBtn, true);
    hideMessages();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in successfully:', userCredential.user.email);
        // Success message will be shown by onAuthStateChanged
    } catch (error) {
        console.error('Login error details:', {
            code: error.code,
            message: error.message,
            email: email
        });
        showError(getErrorMessage(error.code, error.message));
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Signup form handler
signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const collegeName = document.getElementById('collegeName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Basic validation
    if (!collegeName || !email || !password || !confirmPassword) {
        showError('Please fill in all fields.');
        return;
    }

    // Validate college email
    if (!isValidCollegeEmail(email)) {
        showError('Please use a valid college email address. Gmail and other personal email providers are not allowed.');
        return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }

    setButtonLoading(submitBtn, true);
    hideMessages();

    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Realtime Database
        const userData = {
            email: email,
            collegeName: collegeName,
            createdAt: new Date().toISOString(),
            uid: user.uid
        };

        await set(ref(database, 'users/' + user.uid), userData);

        console.log('User created successfully:', {
            email: user.email,
            college: collegeName,
            uid: user.uid
        });

        // Success message will be shown by onAuthStateChanged
    } catch (error) {
        console.error('Signup error details:', {
            code: error.code,
            message: error.message,
            email: email,
            college: collegeName
        });
        showError(getErrorMessage(error.code, error.message));
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out');
        switchToLogin();
        // Clear form fields
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('collegeName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        // Reset password field types
        document.getElementById('loginPassword').type = 'password';
        document.getElementById('signupPassword').type = 'password';
        document.getElementById('confirmPassword').type = 'password';

        // Reset toggle button icons
        document.querySelectorAll('.password-toggle .show-text').forEach(icon => {
            icon.textContent = '👁️';
        });
    } catch (error) {
        console.error('Logout error:', error);
        showError('Error signing out. Please try again.');
    }
});

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('User is signed in:', {
            email: user.email,
            uid: user.uid,
            emailVerified: user.emailVerified
        });

        // Fetch user data from database
        try {
            const userRef = ref(database, 'users/' + user.uid);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                showSuccessWithUserData(user, userData);
            } else {
                // Fallback for users created before database integration
                showSuccessWithUserData(user, { collegeName: 'Unknown College' });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            showSuccessWithUserData(user, { collegeName: 'Unknown College' });
        }
    } else {
        console.log('User is signed out');
        // User will see login/signup forms
        hideMessages();
    }
});

// Show success with user data
function showSuccessWithUserData(user, userData) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userInfo = document.getElementById('userInfo');

    welcomeMessage.textContent = `Welcome to Clustr!`;
    userInfo.textContent = `${user.email} • ${userData.collegeName}`;

    showSuccess();
}

// Error message helper
function getErrorMessage(errorCode, originalMessage = '') {
    console.log('Processing error code:', errorCode, 'Original message:', originalMessage);

    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please check your credentials.';
        case 'auth/invalid-login-credentials':
            return 'Invalid login credentials. Please check your email and password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters long.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/operation-not-allowed':
            return 'Email/password authentication is not enabled. Please contact support.';
        case 'auth/requires-recent-login':
            return 'Please log out and log back in to perform this action.';
        case 'auth/credential-already-in-use':
            return 'This credential is already associated with a different account.';
        case 'auth/timeout':
            return 'Request timed out. Please try again.';
        default:
            // Log unknown errors for debugging
            console.warn('Unknown auth error:', errorCode, originalMessage);
            return `Authentication failed: ${originalMessage || 'Please check your credentials and try again.'}`;
    }
}