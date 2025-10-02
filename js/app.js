import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- Core LLM/API Configuration and Utilities ---
const API_KEY = ""; 
const API_URL_TTS = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;
const AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();

// NOTE: TTS helper functions (base64ToArrayBuffer, pcmToWav, fetchWithBackoff) 
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcm16, sampleRate) {
    const numChannels = 1;
    const bytesPerSample = 2; 
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataLength = pcm16.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true); 
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true); 
    view.setUint32(24, sampleRate, true); 
    view.setUint32(28, byteRate, true); 
    view.setUint16(32, blockAlign, true); 
    view.setUint16(34, 16, true); 
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true); 

    let offset = 44;
    for (let i = 0; i < pcm16.length; i++, offset += 2) {
        view.setInt16(offset, pcm16[i], true);
    }
    return new Blob([buffer], { type: 'audio/wav' });

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

async function fetchWithBackoff(url, options, maxRetries = 5, delay = 1000) {
    // ... fetchWithBackoff logic (kept for completeness)
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            
            if (response.status === 429 || response.status >= 500) {
                if (i === maxRetries - 1) throw new Error(`API failed after ${maxRetries} retries.`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
                continue;
            }

            const errorJson = await response.json();
            throw new Error(`API Error ${response.status}: ${JSON.stringify(errorJson)}`);

        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw new Error("Maximum retries exceeded.");
}


window.app = {
    // Firebase initialization
    firebaseConfig: {
        apiKey: "AIzaSyCBXYulDZnQawTa7bLLXJI-xpaoUMHuy2A",
        authDomain: "robotics123-d78b3.firebaseapp.com",
        projectId: "robotics123-d78b3",
        storageBucket: "robotics123-d78b3.appspot.com",
        messagingSenderId: "737574577469",
        appId: "1:737574577469:web:43f28d72795b39121c5154"
    },

    initFirebase() {
        this.app = initializeApp(this.firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
    },

    saveSubscriptionToFirestore: async function(subscriptionData) {
        try {
            await addDoc(collection(this.db, 'subscriptions'), subscriptionData);
            this.showMessage('Subscription saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving subscription to Firestore:', error);
            this.showMessage('Failed to save subscription: ' + error.message, 'error');
        }
    },

    saveContactToFirestore: async function(contactData) {
        try {
            await addDoc(collection(this.db, 'contacts'), contactData);
            this.showMessage('Contact message sent successfully!', 'success');
        } catch (error) {
            console.error('Error saving contact message to Firestore:', error);
            this.showMessage('Failed to send contact message: ' + error.message, 'error');
        }
    },

    loadAdminDataFromFirestore: async function() {
        try {
            const subscriptionsQuery = query(collection(this.db, 'subscriptions'), orderBy('timestamp', 'desc'));
            const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
            this.state.subscribedData = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const contactsQuery = query(collection(this.db, 'contacts'), orderBy('timestamp', 'desc'));
            const contactsSnapshot = await getDocs(contactsQuery);
            this.state.contactData = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            this.renderAdminDashboard();
        } catch (error) {
            this.showMessage('Failed to load admin data: ' + error.message, 'error');
        }
    },

    deleteAdminRecord: async function(collectionName, id) {
        try {
            await deleteDoc(doc(this.db, collectionName, id));
            this.showMessage('Record deleted successfully!', 'success');
            await this.loadAdminDataFromFirestore();
        } catch (error) {
            this.showMessage('Failed to delete record: ' + error.message, 'error');
        }
    },

    state: {
        currentPage: 'home',
        isAuthenticated: false,
        isAuthModeLogin: false,
        isAdminMode: false,
        user: { email: null, id: null, username: null, role: 'user' },
        registeredUsers: {},
        activeLogins: {},
        subscribedData: [],
        carouselIndex: 0,
        isSpeaking: false,
        audioElement: null,
        currentProjectId: null,
        currentWorkshopId: null,
        authRedirectTarget: null,
    },
    
    // --- DATA STRUCTURES (Admin password changed for clarity) ---
    projectsData: [
        { id: 1, title: "Autonomous Rover", description: "Deep learning model for pathfinding in unstructured environments.", image: "images/pro1.jpg" },
        { id: 2, title: "Medical Assistant Bot", description: "Precision surgical aid prototype using micro-actuators.", image: "images/pro2.jpg" },
        { id: 3, title: "Drone Swarm Control", description: "Decentralized control system for large-scale aerial deployment.", image: "images/pro3.jpg" },
        { id: 4, title: "Ocean Cleanup Drone", description: "AI-powered floating drone for microplastic collection.", image: "images/pro4.jpg" },
        { id: 5, title: "Smart Home Security", description: "Custom behavioral analysis system using low-power sensors.", image: "images/pro5.jpg" },
        { id: 6, title: "Vertical Farming Automation", description: "Robotic arms for planting, harvesting, and climate control in indoor farms.", image: "images/pro6.jpg" },
    ],
    workshopData: {
        id: 1,
        title: "Robotics & Ethical AI Workshop 2024",
        description: "A comprehensive, 3-day intensive workshop covering the fundamentals of machine learning applied to physical robot systems, with a strong emphasis on ethical design and real-world deployment strategies. Learn to program a fully autonomous system from scratch.",
        image: "images/workshop.jpg" 
    },
    carouselImages: [
        { id: 1, url: "images/pic1.jpeg", title: "Advanced Robotics"},
        { id: 2, url: "images/pic2.png", title: "Artificial Intelligence"},
        { id: 3, url: "images/pic3.png", title: "Cutting-Edge Research"},
    ],
    // ADMIN PASSWORD: adminpass123
    adminData: { 
        'admin@tech.com': 'adminpass123' 
    },
    
    // State management
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    },

    // --- UI/UX Utilities ---
    showMessage(message, type = 'info') {
        const modal = document.getElementById('message-modal');
        const titleEl = document.getElementById('modal-title');
        const contentEl = document.getElementById('modal-content');

        titleEl.textContent = type === 'error' ? 'Error' : (type === 'success' ? 'Success' : 'Message');
        contentEl.textContent = message;
        
        titleEl.className = `text-xl font-bold mb-3 ${type === 'error' ? 'text-red-600' : 'text-blue-600'}`;
        
        modal.classList.remove('hidden');
    },

    showSubscribeModal() {
        // If user is logged in, show thank you popup and redirect to Sundar Pichai YouTube channel
        if (this.state.isAuthenticated && this.state.user.role !== 'admin') {
            this.showMessage("Thank you for showing interest in joining us", "success");
            setTimeout(() => {
                window.open("https://www.youtube.com/@RobotixwithSina", "_blank");
            }, 1000);
            return;
        }

        const modal = document.getElementById('subscribe-modal');
        modal.classList.remove('hidden');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.add('animate-fadeInScale');
        }
        document.body.classList.add('modal-open');
    },

    hideSubscribeModal() {
        const modal = document.getElementById('subscribe-modal');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.add('animate-fadeOutScale');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            if (content) {
                content.classList.remove('animate-fadeInScale', 'animate-fadeOutScale');
            }
            document.body.classList.remove('modal-open');
        }, 300);
        document.getElementById('resume-file-label').textContent = 'No file selected.';
    },

    handleSubscriptionSubmit(event) {
        event.preventDefault();
        const name = document.getElementById('sub-name').value;
        const qualification = document.getElementById('sub-qualification').value;
        const domain = document.getElementById('sub-domain').value;
        const linkedin = document.getElementById('sub-linkedin').value;
        const email = document.getElementById('sub-gmail').value;
        const phone = document.getElementById('sub-phone').value;
        const resumeFile = document.getElementById('sub-resume').files[0];

        const subscriptionData = {
            name,
            qualification,
            domain,
            linkedin,
            email,
            phone,
            resumeName: resumeFile ? resumeFile.name : 'N/A',
            timestamp: new Date()
        };

        this.saveSubscriptionToFirestore(subscriptionData);
        this.hideSubscribeModal();
    },
    
    updateResumeLabel(input) {
         const label = document.getElementById('resume-file-label');
         if (input.files.length > 0) {
             label.textContent = `File selected: ${input.files[0].name}`;
         } else {
             label.textContent = 'No file selected.';
         }
    },

    updateContactResumeLabel(input) {
         const label = document.getElementById('contact-resume-file-label');
         if (input.files.length > 0) {
             label.textContent = `File selected: ${input.files[0].name}`;
         } else {
             label.textContent = 'No file selected.';
         }
    },

    // --- Local Authentication Logic (FIXED) ---
   showAuthModal(isLogin = false, isAdmin = false) { 
    const modal = document.getElementById('auth-modal');
    
    // 1. Set the state
    this.state.isAuthModeLogin = isLogin;
    this.state.isAdminMode = isAdmin;
    
    // 2. IMPORTANT: Manually trigger renderAuthModal immediately to update UI/Button logic
    this.renderAuthModal(); 

    // 3. Show modal and re-render app (which will call renderAuthModal again)
    modal.classList.remove('hidden');
    const content = modal.querySelector('.modal-content');
    if (content) {
        content.classList.add('animate-fadeInScale');
    }
    document.body.classList.add('modal-open');
    this.render(); // Redundant render, but guarantees state update
},

    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.add('animate-fadeOutScale');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            if (content) {
                content.classList.remove('animate-fadeInScale', 'animate-fadeOutScale');
            }
            document.body.classList.remove('modal-open');
        }, 300);
        document.getElementById('auth-form').reset();
    },

    closeAuthModal() {
        this.hideAuthModal();
        // Clear all auth flags on close
        this.setState({ isAuthModeLogin: false, authRedirectTarget: null, isAdminMode: false });
    },

    toggleAuthMode() {
        if (!this.state.isAdminMode) {
            this.setState({ isAuthModeLogin: !this.state.isAuthModeLogin });
            this.renderAuthModal(); 
        }
    },

    // in js/app.js, replace the entire renderAuthModal function

renderAuthModal() {
    const { isAuthModeLogin, isAdminMode } = this.state;
    const titleEl = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtnContainer = document.getElementById('toggle-auth-mode-container'); 
    const usernameField = document.getElementById('username-field');
    const adminSwitchBtn = document.querySelector('#auth-modal .text-xs.text-gray-500');

    const titleText = isAdminMode ? 'Admin Login' : (isAuthModeLogin ? 'User Login' : 'User Sign Up');
    if (titleEl) titleEl.textContent = titleText;
    
    // UI visibility based on mode
    if (toggleBtnContainer) toggleBtnContainer.classList.toggle('hidden', isAdminMode);
    if (adminSwitchBtn) adminSwitchBtn.classList.toggle('hidden', isAdminMode); 
    
    if (usernameField) {
        usernameField.classList.toggle('hidden', isAuthModeLogin || isAdminMode);
        document.getElementById('auth-username').required = !(isAuthModeLogin || isAdminMode);
    }
    
    // Button Styling and Text Logic (FIXED TO USE ADMIN RED)
    if (submitBtn) {
        // Remove all existing color classes for clean application
        submitBtn.className = submitBtn.className.replace(/\b(bg-(blue|green|red)-[67]00|shadow-(blue|green|red)-500\/50)\b/g, '');

        if (isAdminMode) {
             submitBtn.textContent = 'Login';
             submitBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'shadow-red-500/50'); // Admin is RED
        } else {
             submitBtn.textContent = isAuthModeLogin ? 'Login' : 'Sign Up';
             if (isAuthModeLogin) {
                 submitBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'shadow-green-500/50');
             } else {
                 submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-500/50');
             }
        }
    }

    const toggleBtn = document.getElementById('toggle-auth-mode');
    if (toggleBtn) {
        toggleBtn.textContent = isAuthModeLogin ? 'Switch to Sign Up' : 'Switch to Login';
    }
},

    async handleAuthSubmit(event) {
        event.preventDefault();
        const email = event.target.email.value.trim();
        const password = event.target.password.value.trim();
        const username = event.target.username ? event.target.username.value.trim() : null;
        const { isAdminMode } = this.state;

        // --- ADMIN LOGIN LOGIC ---
        if (isAdminMode) {
            if (this.adminData[email] === password) {
                this.setState({ 
                    isAuthenticated: true,
                    user: { email: email, id: email, username: 'Admin', role: 'admin' },
                    currentPage: 'adminDashboard', 
                    isAuthModeLogin: false,        
                    isAdminMode: false             
                });
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify({ email: email, id: email, username: 'Admin', role: 'admin' }));
                this.showMessage('Admin Login successful. Welcome to the Dashboard!', 'success');
                this.hideAuthModal();
            } else {
                this.showMessage('Admin Login Failed: Invalid credentials.', 'error');
            }
            return;
        }

        // --- USER LOGIN/SIGNUP LOGIC USING FIREBASE AUTH ---
        const user = this.auth;
        if (this.state.isAuthModeLogin) {
            // USER LOGIN attempt
            try {
                console.log('Attempting login with email:', email);
                const userCredential = await signInWithEmailAndPassword(user, email, password);
                const loggedInUser = userCredential.user;
                const username = loggedInUser.displayName || email.split('@')[0];

                const redirectTarget = this.state.authRedirectTarget;
                let newState = { 
                    isAuthenticated: true,
                    user: { email: loggedInUser.email, id: loggedInUser.uid, username: username, role: 'user' },
                    isAuthModeLogin: false,
                    authRedirectTarget: null
                };
                if (redirectTarget) {
                    newState.currentPage = redirectTarget.page; // Redirect to Projects page
                }
                
                this.setState(newState);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify(newState.user));
                this.showMessage(`Welcome back, ${username}!`, 'success');
                this.hideAuthModal();
            } catch (error) {
                console.error('Login error:', error);
                this.showMessage('Login Failed: ' + error.message, 'error');
            }
        } else {
            // USER SIGN UP attempt
            if (!username) {
                this.showMessage('Sign Up Failed: Username is mandatory.', 'error');
                return;
            }
            if (password.length < 6) {
                this.showMessage('Sign Up Failed: Password must be at least 6 characters.', 'error');
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(user, email, password);
                const newUser = userCredential.user;
                await updateProfile(newUser, { displayName: username });

                this.showMessage('Sign Up successful! Please login now.', 'success');
                this.setState({ isAuthModeLogin: true });
                this.renderAuthModal(); 
                document.getElementById('auth-form').reset();
                // Optionally close modal after signup or keep open for login
                // this.hideAuthModal();
            } catch (error) {
                console.error('Signup error:', error);
                if (error.code === 'auth/email-already-in-use') {
                    this.showMessage('Sign Up Failed: This email is already registered. Please try logging in instead.', 'error');
                } else {
                    this.showMessage('Sign Up Failed: ' + error.message, 'error');
                }
            }
        }
    },

    async handleLogout() {
        const { user } = this.state;
        if (user.role === 'user') {
            delete this.state.activeLogins[user.email];
        }

        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');

        this.showMessage(`You have been successfully logged out.`, 'success');
        this.setState({
            isAuthenticated: false,
            user: { email: null, id: null, username: null, role: 'user' },
            currentPage: 'home',
            isAuthModeLogin: false,
            isAdminMode: false,
            authRedirectTarget: null
        });
    },

    showContactModal() {
        const modal = document.getElementById('contact-modal');
        modal.classList.remove('hidden');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.add('animate-fadeInScale');
        }
        document.body.classList.add('modal-open');
    },

    hideContactModal() {
        const modal = document.getElementById('contact-modal');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.add('animate-fadeOutScale');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            if (content) {
                content.classList.remove('animate-fadeInScale', 'animate-fadeOutScale');
            }
            document.body.classList.remove('modal-open');
        }, 300);
    },

    handleContactSubmit(event) {
        event.preventDefault();
        const name = document.getElementById('contact-name').value;
        const qualification = document.getElementById('contact-qualification').value;
        const domain = document.getElementById('contact-domain').value;
        const linkedin = document.getElementById('contact-linkedin').value;
        const email = document.getElementById('contact-gmail').value;
        const phone = document.getElementById('contact-phone').value;
        const resumeFile = document.getElementById('contact-resume').files[0];

        const contactData = {
            name,
            qualification,
            domain,
            linkedin,
            email,
            phone,
            resumeName: resumeFile ? resumeFile.name : 'N/A',
            timestamp: new Date()
        };

        this.saveContactToFirestore(contactData);
        this.hideContactModal();
    },

    // ... (TTS and Carousel logic remain)
    async toggleNarration() {
        const { isSpeaking, audioElement } = this.state;
        if (isSpeaking) {
            this.setState({ isSpeaking: false, audioElement: null });
            return;
        }
        this.showMessage('Simulating TTS narration now...', 'info');
        this.setState({ isSpeaking: true });
        setTimeout(() => {
            this.showMessage('Narration completed!', 'success');
            this.setState({ isSpeaking: false, audioElement: null });
        }, 3000);
    },

    handleNavigation(page, isProtected, dataId = null) {
        if (isProtected && !this.state.isAuthenticated) {
            this.showMessage('You must be logged in to view the Projects page.', 'error');
            
            this.setState({ 
                isAuthModeLogin: true, 
                authRedirectTarget: { page: 'projects', dataId } 
            }); 
            this.showAuthModal(true);
            return;
        }
        
        let newState = { currentPage: page };
        if (page === 'projectDetails') {
            newState.currentProjectId = dataId;
        }
        if (page === 'workshopDetails') {
            newState.currentWorkshopId = dataId;
        }
        this.setState(newState);
    },

    nextSlide() {
        const newIndex = (this.state.carouselIndex + 1) % this.carouselImages.length;
        this.setState({ carouselIndex: newIndex });
    },

    prevSlide() {
        const len = this.carouselImages.length;
        const newIndex = (this.state.carouselIndex - 1 + len) % len;
        this.setState({ carouselIndex: newIndex });
    },
    
    render() {
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = this.renderNavbar() + this.renderContent();
        }
        
        this.renderFooter();
        this.renderAuthModal();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
};

window.onload = function () {
    // Initialize Firebase
    window.app.initFirebase();

    // Listen for Firebase Auth state changes
    window.app.auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            const username = user.displayName || user.email.split('@')[0];
            window.app.setState({
                isAuthenticated: true,
                user: { email: user.email, id: user.uid, username: username, role: 'user' }
            });
        } else {
            // User is signed out
            window.app.setState({
                isAuthenticated: false,
                user: null
            });
        }
        window.app.render();
    });

    // Initial data setup: Use 'admin@tech.com' with password 'adminpass123'
    window.app.state.subscribedData.push({
        id: 1, date: new Date().toLocaleDateString(), name: 'Alice Chen', qualification: 'PhD Robotics',
        domain: 'Swarm Control', linkedin: 'link_a', email: 'alice@mail.com', resumeName: 'alice_resume.pdf'
    });

    window.app.render();

    setInterval(() => {
        window.app.nextSlide();
    }, 5000);
};
