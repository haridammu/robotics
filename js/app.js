// --- Core LLM/API Configuration and Utilities ---
const API_KEY = ""; 
const API_URL_TTS = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;
const AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();

// NOTE: TTS helper functions (base64ToArrayBuffer, pcmToWav, fetchWithBackoff) 
// Kept for structure, assuming full implementation is here or elsewhere.
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
    // ... pcmToWav logic 
    const numChannels = 1;
    const bytesPerSample = 2; 
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataLength = pcm16.length * bytesPerSample;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true); 
    writeString(view, 8, 'WAVE');

    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true); 
    view.setUint32(24, sampleRate, true); 
    view.setUint32(28, byteRate, true); 
    view.setUint16(32, blockAlign, true); 
    view.setUint16(34, 16, true); 

    // Data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true); 

    // Write the PCM data
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
    // ... fetchWithBackoff logic
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            
            if (response.status === 429 || response.status >= 500) {
                if (i === maxRetries - 1) throw new Error(`API failed after ${maxRetries} retries.`);
                console.warn(`API request failed with status ${response.status}. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
                continue;
            }

            const errorJson = await response.json();
            throw new Error(`API Error ${response.status}: ${JSON.stringify(errorJson)}`);

        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.error("Fetch attempt failed:", error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw new Error("Maximum retries exceeded.");
}


// Main Application Logic
window.app = {
    state: {
        currentPage: 'home',
        isAuthenticated: false,
        isAuthModeLogin: false,
        user: { email: null, id: null, username: null },
        registeredUsers: {},
        carouselIndex: 0,
        isSpeaking: false,
        audioElement: null,
        currentProjectId: null,
        currentWorkshopId: null,
        authRedirectTarget: null, // NEW: Stores the page to navigate to after successful login
    },
    
    // --- DATA STRUCTURES (Image paths corrected to match new format) ---
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
    
    // State management
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    },

    // --- UI/UX Utilities ---
    // ... (showMessage, showSubscribeModal, hideSubscribeModal, handleSubscriptionSubmit, updateResumeLabel unchanged)

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
        document.getElementById('subscribe-modal').classList.remove('hidden');
    },

    hideSubscribeModal() {
        document.getElementById('subscribe-modal').classList.add('hidden');
        document.getElementById('resume-file-label').textContent = 'No file selected.';
    },

    handleSubscriptionSubmit(event) {
        event.preventDefault();
        const name = document.getElementById('sub-name').value;

        this.hideSubscribeModal();
        this.showMessage(`Thank you, ${name}! Your subscription details have been noted. We will contact you soon.`, 'success');
    },
    
    updateResumeLabel(input) {
         const label = document.getElementById('resume-file-label');
         if (input.files.length > 0) {
             label.textContent = `File selected: ${input.files[0].name}`;
         } else {
             label.textContent = 'No file selected.';
         }
    },


    // --- Local Authentication Logic (MODIFIED for Redirect) ---
    showAuthModal(isLogin = false) {
        const modal = document.getElementById('auth-modal');
        this.setState({ isAuthModeLogin: isLogin });
        modal.classList.remove('hidden');
    },

    hideAuthModal() {
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('auth-form').reset();
    },

    // NEW: Function to close Auth modal (needed for the close button)
    closeAuthModal() {
        this.hideAuthModal();
        this.setState({ isAuthModeLogin: false, authRedirectTarget: null });
    },


    toggleAuthMode() {
        this.setState({ isAuthModeLogin: !this.state.isAuthModeLogin });
        this.renderAuthModal(); 
    },

    renderAuthModal() {
        const isLogin = this.state.isAuthModeLogin;
        const titleEl = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const toggleBtn = document.getElementById('toggle-auth-mode');
        const usernameField = document.getElementById('username-field');
        const closeBtnContainer = document.getElementById('auth-modal-close-container'); // NEW

        if (titleEl) titleEl.textContent = isLogin ? 'Login' : 'Sign Up';
        if (submitBtn) submitBtn.textContent = isLogin ? 'Login' : 'Sign Up';
        if (toggleBtn) toggleBtn.textContent = isLogin ? 'Switch to Sign Up' : 'Switch to Login';
        
        // Show/Hide Username field
        if (usernameField) {
            usernameField.classList.toggle('hidden', isLogin);
            document.getElementById('auth-username').required = !isLogin;
        }

        // NEW: Ensure close button is rendered (moved to index.html for simplicity)
    },

    async handleAuthSubmit(event) {
        event.preventDefault();
        const email = event.target.email.value.trim();
        const password = event.target.password.value.trim();
        const username = event.target.username ? event.target.username.value.trim() : null;
        const users = this.state.registeredUsers;

        if (this.state.isAuthModeLogin) {
            // LOGIN attempt
            if (users[email] && users[email].password === password) {
                
                const redirectTarget = this.state.authRedirectTarget;
                
                let newState = { 
                    isAuthenticated: true,
                    user: { email: email, id: email, username: users[email].username },
                    isAuthModeLogin: false,
                    authRedirectTarget: null // Clear the target
                };

                // Redirect logic: If coming from a protected page, go there.
                if (redirectTarget) {
                    newState.currentPage = redirectTarget.page;
                    // Note: Simplified. For 'projectDetails' you'd need the dataId, but here we just navigate to 'projects'.
                }
                
                this.setState(newState);
                this.showMessage(`Welcome back, ${users[email].username}!`, 'success');
                this.hideAuthModal();
            } else {
                this.showMessage('Login Failed: Invalid email or password.', 'error');
            }
        } else {
            // SIGN UP attempt (Unchanged)
            if (!username) {
                this.showMessage('Sign Up Failed: Username is mandatory.', 'error');
                return;
            }
            if (users[email]) {
                this.showMessage('Sign Up Failed: This email is already registered.', 'error');
            } else if (password.length < 6) {
                this.showMessage('Sign Up Failed: Password must be at least 6 characters.', 'error');
            }
            else {
                users[email] = { password: password, username: username };
                this.setState({ registeredUsers: users, isAuthModeLogin: true });
                this.showMessage('Sign Up successful! Please login now.', 'success');
                this.renderAuthModal(); 
                document.getElementById('auth-form').reset();
            }
        }
    },
    
    async handleLogout() {
        this.showMessage('You have been successfully logged out.', 'success');
        this.setState({ 
            isAuthenticated: false, 
            user: { email: null, id: null, username: null },
            currentPage: 'home', 
            isAuthModeLogin: false,
            authRedirectTarget: null
        });
    },

    // ... (toggleNarration, nextSlide, prevSlide, render unchanged)

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
            
            // Set the redirect target to 'projects' before showing login
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

// Start the app when the window loads
window.onload = function () {
    window.app.state.registeredUsers['test@example.com'] = { password: 'password123', username: 'TestUser' }; 

    window.app.render(); 

    setInterval(() => {
        window.app.nextSlide();
    }, 5000); 
};