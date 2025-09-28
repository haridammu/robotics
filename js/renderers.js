// This file assumes 'window.app' is already defined by app.js

window.app.renderNavbar = function() {
    const { isAuthenticated, user, currentPage } = this.state;
    
    const navLinks = [
        { name: 'Home', page: 'home' },
        { name: 'Projects', page: 'projects', protected: true },
        { name: 'Workshops', page: 'workshops' },
        { name: 'Our Labs', page: 'labs' },
        { name: 'Resources', page: 'resources' },
    ];

    let authButton;
    let subscribeButton = '';
    
    if (isAuthenticated) {
        const userName = user?.username ? user.username : 'Guest';
        authButton = `
            <div class="flex items-center space-x-4">
                <span class="text-sm font-medium text-blue-600 hidden md:block">WELCOME ${userName.toUpperCase()}</span>
                <button onclick="window.app.handleLogout()"
                    class="py-2 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition duration-300 shadow-lg shadow-red-500/50"
                >
                    LOGOUT
                </button>
            </div>
        `;
        subscribeButton = `
            <button onclick="window.app.showSubscribeModal()"
                class="py-2 px-4 rounded-full font-semibold transition duration-300 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/50"
            >
                SUBSCRIBE
            </button>
        `;
    } else {
        const authMode = this.state.isAuthModeLogin ? 'LOGIN' : 'SIGN UP';
        authButton = `
            <button onclick="window.app.showAuthModal(${this.state.isAuthModeLogin})"
                class="py-2 px-4 rounded-full font-semibold transition duration-300 
                ${authMode === 'SIGN UP' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50' : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50'}"
            >
                ${authMode}
            </button>
        `;
    }

    const navHTML = `
        <nav class="flex items-center justify-between p-4 px-8 backdrop-blur-md bg-white/95 sticky top-0 z-40 border-b border-blue-200 shadow-lg">
            <div class="flex items-center space-x-2">
                <i data-lucide="microscope" class="w-6 h-6 text-blue-600"></i>
                <span class="text-2xl font-bold text-gray-900">Tech<span class="text-blue-600">Robotics</span></span>
            </div>
            <div class="hidden md:flex items-center space-x-6">
                ${navLinks.map(link => {
                    const activeClass = currentPage === link.page ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:text-blue-600';
                    return `
                        <button 
                            onclick="window.app.handleNavigation('${link.page}', ${link.protected})"
                            class="py-2 px-3 rounded-lg font-medium transition duration-200 ${activeClass}"
                        >
                            ${link.name}
                        </button>
                    `;
                }).join('')}
            </div>
            <div class="flex items-center space-x-4">
                ${subscribeButton}
                ${authButton}
            </div>
        </nav>
    `;
    return navHTML;
};

// --- Content Switcher (Unchanged) ---
window.app.renderContent = function() {
    const { currentPage } = this.state;
    switch (currentPage) {
        case 'home':
            return this.renderHome();
        case 'projects':
            return this.renderProjects();
        case 'projectDetails':
            return this.renderProjectDetails(this.state.currentProjectId);
        case 'details': // Carousel Details Page
            return this.renderDetails();
        case 'workshops':
            return this.renderWorkshops();
        case 'workshopDetails':
            return this.renderWorkshopDetails(this.state.currentWorkshopId);
        case 'labs':
            return this.renderLabs(); 
        case 'resources':
            return this.renderResources(); 
        default:
            return this.renderHome();
    }
};

// --- Home Page Content (Animation Added) ---
window.app.renderHome = function() {
    return `
        <div class="container mx-auto px-4 py-8">
            <section class="mb-16">
                <h2 class="text-4xl font-extrabold text-center mb-6 text-gray-900 tracking-tight anim-pulse-on-click">Our Latest Innovations</h2>
                ${this.renderCarousel()}
            </section>

            <section class="mb-16 p-10 rounded-xl glass-card bg-no-repeat bg-cover bg-center" style="background-image: url('https://placehold.co/1200x300/e0f2ff/000080?text=Innovation+Background');">
                <h2 class="text-4xl font-extrabold text-blue-600 mb-6 text-center anim-pulse-on-click">OUR GOAL</h2>
                <div class="relative">
                    <div class="p-6 rounded-lg bg-white/70 backdrop-blur-sm animate-goal border border-blue-400/30 shadow-md">
                        <p class="text-lg text-gray-800 leading-relaxed font-light">
                            Our primary goal is to **democratize cutting-edge robotic technology**, making it accessible for education, industry, and personal development globally. We strive to be the nexus where human creativity meets machine precision, fostering a community of innovators ready to build the next generation of smart systems. Through relentless research and ethical deployment, we aim to solve complex real-world challenges, from sustainable agriculture to advanced medical assistance, ultimately empowering a future where humans and robots collaborate seamlessly.
                        </p>
                    </div>
                </div>
            </section>
            
            <section class="space-y-8 mb-16">
                <div class="p-10 rounded-xl glass-card border-blue-400/30 shadow-md transition duration-300">
                    <h3 class="text-4xl font-extrabold text-blue-600 mb-6 text-center flex items-center justify-center anim-pulse-on-click">
                        <i data-lucide="users" class="w-8 h-8 mr-3"></i> ABOUT US
                    </h3>
                    <div class="p-6 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-400/30 shadow-md">
                        <p class="text-lg text-gray-800 leading-relaxed font-light">
                            Founded by a team of visionary engineers and educators, TechRobotics is committed to pushing the boundaries of AI and automation. We specialize in modular robotics kits, online workshops, and enterprise-level consultancy, ensuring our solutions are practical, scalable, and future-proof. Our history is built on a foundation of academic rigor and a relentless drive for practical, impactful innovation in the field of artificial intelligence and physical systems.
                        </p>
                    </div>
                </div>

                <div class="p-10 rounded-xl glass-card border-blue-400/30 shadow-md transition duration-300">
                    <h3 class="text-4xl font-extrabold text-blue-600 mb-6 text-center flex items-center justify-center anim-pulse-on-click">
                        <i data-lucide="target" class="w-8 h-8 mr-3"></i> OUR MOTIVE
                    </h3>
                    <div class="p-6 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-400/30 shadow-md">
                        <p class="text-lg text-gray-800 leading-relaxed font-light">
                            Our core motive is to ignite passion for STEM fields in the younger generation. We believe that computational thinking and practical engineering skills are the bedrock of future innovation, and our products are designed to make learning complex concepts engaging and intuitive. We aim to close the technological gap and ensure that the tools of creation are in the hands of everyone, fostering a truly global community of makers and thinkers.
                        </p>
                    </div>
                </div>

                <div class="p-10 rounded-xl glass-card border-blue-400/30 shadow-md transition duration-300">
                    <h3 class="text-4xl font-extrabold text-blue-600 mb-6 text-center flex items-center justify-center anim-pulse-on-click">
                        <i data-lucide="tool" class="w-8 h-8 mr-3"></i> OUR SERVICES
                    </h3>
                    
                    <div class="flex flex-col md:flex-row items-start md:space-x-8">
                        <div class="flex items-center space-x-4 mb-4 md:mb-0 md:w-1/3">
                            <i data-lucide="toy-brick" class="w-10 h-10 text-blue-500 flex-shrink-0"></i>
                            <span class="text-3xl font-bold text-gray-900 whitespace-nowrap">TechRobotics</span>
                        </div>
                        
                        <div class="p-6 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-400/30 shadow-md md:w-2/3">
                            <p class="text-lg text-gray-800 leading-relaxed font-light">
                                We offer **custom industrial automation**, R&D partnerships, and comprehensive **educational curricula** focused on real-time hardware-software interaction and ethical AI design. Our flagship product line includes modular robotics kits, online workshops, and enterprise-level consultancy. We continuously update our offerings to provide the most advanced and aesthetically professional solutions available in the market.
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-8 border-t border-gray-300 pt-4 text-center">
                        <h4 class="text-3xl font-extrabold text-gray-900 mb-2">KEEP IN TOUCH</h4>
                        <p class="text-lg text-gray-600">Follow our journey and join the community on social media (check the fixed footer below!) to see our latest innovations.</p>
                    </div>
                </div>
            </section>
        </div>
    `;
};

window.app.renderCarousel = function() {
    // ... (Unchanged from original)
    const { carouselIndex } = this.state;
    const currentImage = this.carouselImages[carouselIndex];
    
    const transitionClass = 'transition-opacity duration-700 ease-in-out';

    const carouselHTML = `
        <div class="relative w-full overflow-hidden rounded-3xl shadow-2xl border-4 border-blue-600/50">
            <div class="aspect-video w-full">
                <img id="carousel-img" src="${currentImage.url}" alt="${currentImage.title}" class="w-full h-full object-cover ${transitionClass}" />
                
                <div class="absolute inset-0 flex items-end justify-center p-8 bg-black/30">
                    <button onclick="window.app.handleNavigation('details', false, ${currentImage.id})"
                        class="text-lg font-bold py-3 px-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition duration-300 transform hover:scale-105 shadow-xl shadow-orange-500/50"
                    >
                        See Details
                    </button>
                </div>
            </div>

            <div class="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 p-2 bg-black/20">
                ${this.carouselImages.map((img, index) => `
                    <button 
                        onclick="window.app.setState({ carouselIndex: ${index} })"
                        class="w-3 h-3 rounded-full transition duration-300 ${index === carouselIndex ? 'bg-blue-500 ring-2 ring-white' : 'bg-gray-400 hover:bg-white'}"
                    ></button>
                `).join('')}
            </div>

            <button onclick="window.app.prevSlide()" class="absolute top-1/2 left-4 transform -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition duration-300">
                <i data-lucide="chevron-left" class="w-6 h-6"></i>
            </button>
            <button onclick="window.app.nextSlide()" class="absolute top-1/2 right-4 transform -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition duration-300">
                <i data-lucide="chevron-right" class="w-6 h-6"></i>
            </button>
        </div>
    `;
    return carouselHTML;
};


// --- Projects Page Content (MODIFIED for Image Display) ---
window.app.renderProjects = function() {
    const { user } = this.state;
    const userName = user?.username ? user.username : 'Guest';
    
    return `
        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-10">
                <h2 class="text-xl font-bold text-blue-600">WELCOME ${userName.toUpperCase()}</h2>
                <h1 class="text-5xl font-extrabold text-gray-900 anim-pulse-on-click">Our Exclusive Projects</h1>
                <div></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                ${this.projectsData.map(project => `
                    <div class="glass-card rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border-blue-400/50">
                        <div class="project-image-container" style="background-image: url('${project.image}');">
                            <div class="project-image-overlay">
                                <h3 class="text-2xl font-bold text-white leading-tight mb-1">${project.title}</h3>
                                <p class="text-gray-200 text-sm">${project.description}</p>
                            </div>
                        </div>
                        
                        <div class="p-6 flex flex-col justify-between">
                            <button onclick="window.app.handleNavigation('projectDetails', false, ${project.id})"
                                class="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 shadow-md"
                            >
                                See Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// --- Project Details Page Content (Animation Added) ---
window.app.renderProjectDetails = function(projectId) {
    const project = this.projectsData.find(p => p.id === projectId) || this.projectsData[0];
    
    return `
        <div class="container mx-auto px-4 py-16">
            <div class="glass-card p-10 rounded-2xl max-w-4xl mx-auto border-4 border-blue-400/50 shadow-2xl">
                <h1 class="text-5xl font-extrabold text-blue-600 mb-4 anim-pulse-on-click">${project.title}</h1>
                <p class="text-xl text-gray-700 mb-6">${project.description}</p>
                
                <div class="w-full h-80 bg-gray-200 rounded-xl overflow-hidden mb-8 shadow-inner" style="background-image: url('${project.image}'); background-size: cover; background-position: center;">
                    <div class="bg-black/20 w-full h-full flex items-center justify-center">
                        <span class="text-white text-3xl font-bold">In-Depth View</span>
                    </div>
                </div>

                <div class="text-left space-y-4 text-gray-800">
                    <h3 class="text-3xl font-bold text-gray-900 border-b pb-2">Technical Overview</h3>
                    <p>The ${project.title} project utilizes cutting-edge sensors and a modular design approach. Development focused heavily on optimizing energy consumption and ensuring rugged durability for real-world scenarios. We utilized a custom-built TensorFlow model running on an embedded system for real-time decision-making.</p>
                    <p>This project represents a major step forward in field autonomy, demonstrating reliable performance even in unpredictable environments. Detailed schematics and source code are available internally.</p>
                </div>

                <button onclick="window.app.handleNavigation('projects', false)" 
                    class="mt-10 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300 shadow-lg"
                >
                    Back to Projects
                </button>
            </div>
        </div>
    `;
};

// --- Workshops Page Content (MODIFIED for Background) ---
window.app.renderWorkshops = function() {
    const workshop = this.workshopData;

    return `
        <div class="container mx-auto px-4 py-16">
            <h1 class="text-5xl font-extrabold text-blue-600 mb-8 text-center anim-pulse-on-click">Our Current Workshops</h1>

            <div class="glass-card workshop-card p-8 rounded-2xl max-w-5xl mx-auto border-blue-400/50 shadow-2xl transition duration-300" 
                 style="background-image: url('${workshop.image}'); background-blend-mode: overlay; background-color: rgba(255, 255, 255, 0.9);">
                <h2 class="text-3xl font-bold text-gray-900 mb-4">${workshop.title}</h2>
                
                <p class="text-lg text-gray-800 font-semibold mb-6">Explore the cutting edge of autonomous systems with our expert-led course.</p>
                <p class="text-lg text-gray-700">${workshop.description}</p>

                <div class="mt-8 text-center">
                    <button onclick="window.app.handleNavigation('workshopDetails', false, ${workshop.id})"
                        class="text-lg font-bold py-3 px-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition duration-300 transform hover:scale-105 shadow-xl shadow-orange-500/50"
                    >
                        See Details & Enroll
                    </button>
                </div>
            </div>
        </div>
    `;
};

// --- Workshop Details Page Content (Animation Added) ---
window.app.renderWorkshopDetails = function(workshopId) {
    const workshop = this.workshopData;
    
    return `
        <div class="container mx-auto px-4 py-16">
            <div class="glass-card p-10 rounded-2xl max-w-4xl mx-auto border-4 border-blue-400/50 shadow-2xl">
                <h1 class="text-5xl font-extrabold text-blue-600 mb-4 anim-pulse-on-click">${workshop.title} - Detailed Agenda</h1>
                
                <div class="text-left space-y-6 text-gray-800">
                    <h3 class="text-3xl font-bold text-gray-900 border-b pb-2">What You Will Learn</h3>
                    <ul class="list-disc list-inside space-y-2 ml-4">
                        <li>Day 1: Microcontroller Programming (Arduino/Raspberry Pi) and Sensor Interfacing.</li>
                        <li>Day 2: Kinematics, Actuator Control, and Building the Robot Frame.</li>
                        <li>Day 3: Introduction to AI/ML for Computer Vision and Ethical Robotics Guidelines.</li>
                    </ul>
                    
                    <h3 class="text-3xl font-bold text-gray-900 border-b pb-2">Prerequisites</h3>
                    <p>Basic knowledge of Python or C++ is recommended. Participants should bring a laptop for programming exercises.</p>
                    
                    <h3 class="text-3xl font-bold text-gray-900 border-b pb-2">Instructor</h3>
                    <p>Led by Dr. Alice Chen, Lead Roboticist at TechRobotics, specializing in swarm robotics and autonomous systems.</p>
                </div>

                <button onclick="window.app.handleNavigation('workshops', false)" 
                    class="mt-10 py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300 shadow-lg"
                >
                    Back to Workshops
                </button>
            </div>
        </div>
    `;
};

// ... (renderDetails, renderLabs, renderResources, renderFooter are unchanged)

window.app.renderDetails = function() {
    const { isSpeaking } = this.state;
    return `
        <div class="container mx-auto px-4 py-16 text-center">
            <div class="glass-card p-10 rounded-2xl max-w-2xl mx-auto border-4 border-blue-400/50 shadow-2xl">
                <h1 class="text-5xl font-extrabold text-gray-900 mb-4 anim-pulse-on-click">Carousel Project Details</h1>
                <p class="text-3xl font-light text-blue-600">"Content of Ramesh Sir <span class="font-bold text-blue-800">#ROBOTICIAN</span>"</p>
                <p class="mt-6 text-gray-700">This is the dedicated details page for the selected item from the carousel. This key project represents a milestone in applied robotics.</p>
                
                <button onclick="window.app.toggleNarration()" 
                    class="mt-8 py-3 px-6 bg-sky-500 hover:bg-sky-600 rounded-lg text-white font-semibold transition duration-300 flex items-center justify-center mx-auto w-full md:w-auto"
                >
                    <i data-lucide="${isSpeaking ? 'pause-circle' : 'volume-2'}" class="w-5 h-5 mr-2"></i> 
                    ${isSpeaking ? 'Stop Narration' : 'Read Content Aloud (TTS)'}
                </button>

                <button onclick="window.app.setState({ currentPage: 'home' })" class="mt-4 py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition duration-300">
                    Back to Home
                </button>
            </div>
        </div>
    `;
};

window.app.renderLabs = function() {
    return `<div class="p-10 text-center container mx-auto"><h1 class="text-6xl font-extrabold text-blue-600 mb-4 anim-pulse-on-click">Our Labs</h1><p class="mt-4 text-2xl text-gray-600">This page is coming soon! Expect an immersive showcase of our physical research and development facilities.</p></div>`;
};

window.app.renderResources = function() {
    return `<div class="p-10 text-center container mx-auto"><h1 class="text-6xl font-extrabold text-blue-600 mb-4 anim-pulse-on-click">Resources</h1><p class="mt-4 text-2xl text-gray-600">This page is coming soon! We'll provide tutorials, documentation, and open-source contributions here.</p></div>`;
};


window.app.renderFooter = function() {
    const { user, isAuthenticated } = this.state;
    const userEmail = isAuthenticated ? user.email : 'UnauthenticatedUser@techrobotics.com';
    
    const mailBody = encodeURIComponent(`Hello Sundar Pichai,\n\nI am writing to you from the TechRobotics website regarding [Your Subject Here].\n\n[Your Message Here]\n\nRegards,\n(Sent by: ${userEmail})`);
    const mailSubject = encodeURIComponent("Inquiry from TechRobotics Website User");
    const mailtoLink = `mailto:sundarpichai@gmail.com?subject=${mailSubject}&body=${mailBody}`;

    const socialLinks = [
        { icon: 'fab fa-whatsapp', href: 'https://wa.me/919154631244', name: 'WhatsApp', color: 'text-white hover:text-green-400' },
        { icon: 'fas fa-envelope', href: mailtoLink, name: 'Gmail (Sundar Pichai)', color: 'text-white hover:text-red-400' },
        { icon: 'fab fa-linkedin', href: 'https://www.linkedin.com/in/sundarpichai/', name: 'LinkedIn', color: 'text-white hover:text-blue-200' },
        { icon: 'fab fa-youtube', href: 'https://www.youtube.com/@Google', name: 'YouTube', color: 'text-white hover:text-red-400' },
        { icon: 'fab fa-instagram', href: 'https://www.instagram.com/sundarpichai/?hl=en', name: 'Instagram', color: 'text-white hover:text-pink-400' },
        { icon: 'fab fa-twitter', href: 'https://twitter.com/sundarpichai', name: 'Twitter (X)', color: 'text-white hover:text-sky-400' },
    ];

    const footerHTML = `
        <div class="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-blue-200 px-4">
            <p>&copy; ${new Date().getFullYear()} TechRobotics. All rights reserved.</p>
            <div class="flex space-x-6 mt-3 md:mt-0">
                ${socialLinks.map(link => `
                    <a href="${link.href}" target="_blank" rel="noopener noreferrer" class="hover:scale-110 transition duration-300 ${link.color}" title="${link.name}">
                        <i class="${link.icon} text-2xl"></i>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
    document.getElementById('footer').innerHTML = footerHTML;
};