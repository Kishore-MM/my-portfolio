import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Local Image Imports ---
// Make sure you have an 'assets' folder in your 'src' directory
// and that the image files are named correctly.
import profilePhoto from './assets/profile-photo.png';
import projectEmsImage from './assets/project-ems.png';
import projectAiImage from './assets/project-ai.png';
import projectCrmImage from './assets/project-crm.png';


// --- Helper Functions & Firebase Config ---

// IMPORTANT: These global variables are provided by the environment.
// eslint-disable-next-line no-undef
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// eslint-disable-next-line no-undef
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-portfolio-app';
const apiKey = ""; // The environment will provide the key for Gemini API calls.

// --- Icon Components (using SVG for portability) ---

const InfoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

const SunIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

const BriefcaseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);

const CodeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);

const GraduationCapIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
);

const MailIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
);

const GithubIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);

const LinkedinIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

const DownloadIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const SparklesIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.94 14.32a1 1 0 0 0 1.06-1.06l.2-1.84a1 1 0 0 0-1.06-1.06l-1.84.2a1 1 0 0 0-1.06 1.06l-.2 1.84a1 1 0 0 0 1.06 1.06zM14 6l.94.94M18 10l.94.94M18 14l-.94.94M14 18l-.94.94M10 18l-.94-.94M6 14l-.94-.94M6 10l.94-.94M10 6l.94-.94"></path><path d="M12 2v4M22 12h-4M12 22v-4M2 12H6"></path></svg>
);

const CloseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);


// --- Data extracted from Resume ---
const portfolioData = {
    name: "Kishore M M",
    title: "Java Full Stack Developer",
    linkedin: "https://www.linkedin.com/in/kishore-m-m-cse",
    github: "https://github.com/Kishore-MM",
    email: "kishoremm9741887590@gmail.com",
    phone: "+91 9019715848",
    resumeUrl: "./Kishore_M_M_Resume.pdf",
    summary: "A highly motivated and recent Computer Science graduate specializing in Java Full Stack Development. Passionate about building robust and scalable applications, with hands-on experience in Spring Boot, React, and cloud technologies. Eager to apply strong problem-solving and debugging skills to contribute to a challenging and growth-oriented team.",
    skills: {
        "Programming Languages": ["Java", "Core Java", "Python", "JavaScript", "HTML5", "CSS3", "SQL"],
        "Frameworks & Libraries": ["Spring Boot", "Hibernate", "JDBC", "Servlets", "ReactJS", "Bootstrap"],
        "Database Technologies": ["MySQL", "Oracle", "RDBMS", "Database Design"],
        "Development Tools": ["Eclipse IDE", "Apache Tomcat", "Maven", "MySQL Workbench", "Git", "GitHub", "Postman"],
        "Professional Competencies": ["Agile/Scrum", "RESTful APIs", "Team Collaboration", "Problem Solving"]
    },
    projects: [
        {
            title: "Employee Management System",
            description: "A comprehensive Java-based system to manage employee records with full CRUD functionality. Utilized Hibernate ORM, HQL, and Criteria API for efficient data access and persistence.",
            tags: ["Java", "Hibernate", "JDBC", "Servlet", "SQL", "HTML", "CSS"],
            imageUrl: projectEmsImage,
            sourceCode: "https://github.com/Kishore-MM/Employee-Management-System"
        },
        {
            title: "AI Attendance System",
            description: "Developed an innovative attendance system using AI for face recognition, providing a seamless and secure method for tracking presence.",
            tags: ["Python", "AI", "OpenCV", "Face Recognition"],
            imageUrl: projectAiImage,
            sourceCode: "https://github.com/Kishore-MM/AI-Attendance-System"
        },
        {
            title: "CRM Web App on IBM Cloud",
            description: "Built and deployed a Customer Relationship Management web application on IBM Cloud. Integrated IBM Watson AI for intelligent analysis of customer data.",
            tags: ["IBM Cloud", "Watson AI", "HTML", "CSS", "JavaScript"],
            imageUrl: projectCrmImage,
            sourceCode: "https://github.com/Kishore-MM/CRM-WebApp-IBM"
        }
    ],
    experience: [
        {
            role: "Java Full Stack Developer Intern (Academic Role)",
            company: "JSpiders",
            date: "2024 - 2025",
            description: "Built and debugged full-stack web applications using Java, Spring Boot, and Hibernate in a layered architecture. Collaborated in an agile environment using Git, integrated frontends with RESTful services, and gained experience in testing and deployment.",
        },
        {
            role: "Campus Ambassador | Data Quality Analyst Intern",
            company: "Rooman Technologies with NSDC",
            date: "2023",
            description: "Enhanced data accuracy through quality analysis and AI governance, while developing leadership and communication skills as a campus ambassador promoting tech initiatives.",
        }
    ],
    education: {
        degree: "Bachelor of Engineering in Computer Science",
        institution: "Ghousia College of Engineering, Ramanagara",
        cgpa: "9.11",
        year: "2025"
    },
    certifications: [
        "Java Full Stack Developer - JSpiders",
        "Full Stack Development Program - InnovaSkill Technologies",
        "Career Essentials in Generative AI - Microsoft & LinkedIn",
        "The Complete 2024 Web Development Bootcamp - Udemy",
        "AI Data Quality Analytics - IBM"
    ]
};

// --- Gemini API Call Function ---
const askGemini = async (prompt) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure:", result);
                throw new Error("Could not extract text from Gemini response.");
            }
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            attempt++;
            if (attempt >= maxRetries) {
                 throw error;
            }
            // eslint-disable-next-line no-loop-func
            await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
        }
    }
     throw new Error("API request failed after multiple retries.");
};


// --- React Components ---

const ApiLimitNotification = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 6000); // Auto-close after 6 seconds
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm flex flex-col items-center text-center p-6">
                <InfoIcon className="w-12 h-12 text-teal-500 dark:text-teal-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Feature Not Available</h3>
                <p className="text-slate-600 dark:text-gray-300">
                    The Gemini API and Firebase write operations are disabled in this public demo to prevent misuse. The code for these features is included in the project.
                </p>
                <button 
                    onClick={onClose}
                    className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-slate-600 dark:text-gray-300 prose prose-slate dark:prose-invert prose-p:my-2 prose-headings:text-teal-600 dark:prose-headings:text-teal-400 prose-strong:text-slate-900 dark:prose-strong:text-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ThemeToggle = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="p-2 rounded-full text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        aria-label="Toggle theme"
    >
        {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-slate-700" />}
    </button>
);

const Header = ({ theme, toggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navLinks = ["About", "Skills", "Projects", "Experience", "Contact"];

    return (
        <header className="bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                <a href="#home" className="text-2xl font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Kishore M M
                </a>
                <nav className="hidden md:flex items-center space-x-2">
                    {navLinks.map(link => (
                        <a 
                           key={link} 
                           href={`#${link.toLowerCase()}`} 
                           className="px-4 py-2 rounded-md text-slate-600 dark:text-gray-300 font-medium transition-colors duration-300 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            {link}
                        </a>
                    ))}
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </nav>
                <div className="md:hidden flex items-center">
                     <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 dark:text-white focus:outline-none ml-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-slate-100 dark:bg-slate-950">
                    <nav className="flex flex-col items-center space-y-2 py-4">
                        {navLinks.map(link => (
                            <a 
                               key={link} 
                               href={`#${link.toLowerCase()}`} 
                               onClick={() => setIsMenuOpen(false)} 
                               className="px-4 py-2 rounded-md text-slate-600 dark:text-gray-300 font-medium transition-colors duration-300 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white w-full text-center"
                            >
                                {link}
                            </a>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

const Hero = ({ data, visitorCount }) => (
    <section id="home" className="bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="relative inline-block mb-6">
                 <img 
                    src={profilePhoto} 
                    alt="Kishore M M"
                    className="w-32 h-32 rounded-full mx-auto border-4 border-teal-500 dark:border-teal-400 shadow-lg bg-gray-200 dark:bg-gray-700 object-cover"
                 />
                 <span className="absolute bottom-0 right-0 block h-6 w-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" title="Available for work"></span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                Hi, I'm <span className="text-teal-600 dark:text-teal-400">{data.name}</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                {data.title}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4">
                <a href={data.resumeUrl} download="Kishore_M_M_Resume.pdf" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center space-x-2">
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download CV</span>
                </a>
                <a href="#contact" className="bg-slate-700 hover:bg-slate-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                    Contact Me
                </a>
            </div>
            <div className="mt-12 text-slate-500 dark:text-gray-400 space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span>1 person currently viewing</span>
                </div>
                {visitorCount !== null && (
                     <div className="flex items-center justify-center space-x-2 text-sm">
                        <EyeIcon className="w-5 h-5" />
                        <span>Total Profile Views: {visitorCount}</span>
                    </div>
                )}
            </div>
        </div>
    </section>
);

const About = ({ summary, onGenerateSummary }) => (
    <section id="about" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">About Me</h2>
            <div className="w-20 h-1 bg-teal-500 dark:bg-teal-400 mx-auto mb-12"></div>
            <p className="max-w-3xl mx-auto text-center text-slate-600 dark:text-gray-300 text-lg leading-relaxed">
                {summary}
            </p>
            <div className="text-center mt-8">
                <button 
                    onClick={onGenerateSummary}
                    className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:bg-teal-500/20 dark:hover:bg-teal-500/40 dark:text-teal-300 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>✨ Get AI-Powered Summary</span>
                </button>
            </div>
        </div>
    </section>
);

const Skills = ({ skills }) => (
    <section id="skills" className="py-20 bg-slate-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">Technical Skills</h2>
            <div className="w-20 h-1 bg-teal-500 dark:bg-teal-400 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(skills).map(([category, skillList]) => (
                    <div key={category} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-teal-500/10 dark:hover:shadow-teal-400/20 transition-shadow duration-300">
                        <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-4">{category}</h3>
                        <div className="flex flex-wrap gap-2">
                            {skillList.map(skill => (
                                <span key={skill} className="bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const Projects = ({ projects }) => (
    <section id="projects" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">Projects</h2>
            <div className="w-20 h-1 bg-teal-500 dark:bg-teal-400 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300 border border-slate-200 dark:border-gray-700">
                        <img 
                            src={project.imageUrl} 
                            alt={project.title} 
                            className="w-full h-48 object-cover" 
                        />
                        <div className="p-6 flex-grow">
                            <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-2">{project.title}</h3>
                            <p className="text-slate-600 dark:text-gray-400 mb-4 text-sm flex-grow">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.tags.map(tag => (
                                    <span key={tag} className="bg-teal-100 text-teal-800 dark:bg-gray-700 dark:text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-800 mt-auto flex justify-end space-x-4 border-t border-slate-200 dark:border-gray-700">
                            {project.sourceCode && (
                                <a href={project.sourceCode} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center space-x-2">
                                    <GithubIcon className="w-5 h-5" />
                                    <span>Source Code</span>
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const Experience = ({ experience, education, certifications }) => (
    <section id="experience" className="py-20 bg-slate-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">My Journey</h2>
            <div className="w-20 h-1 bg-teal-500 dark:bg-teal-400 mx-auto mb-12"></div>
            <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 text-center">Experience</h3>
                <div className="relative border-l-2 border-slate-200 dark:border-gray-700 ml-4 md:ml-0">
                    {experience.map((exp, index) => (
                        <div key={index} className="mb-12">
                            <div className="absolute -left-4 md:-left-5 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-gray-900">
                                <BriefcaseIcon className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="ml-10 md:ml-12">
                                <h4 className="text-xl font-bold text-teal-600 dark:text-teal-400">{exp.role}</h4>
                                <p className="text-slate-500 dark:text-gray-400 mb-2">{exp.company} | {exp.date}</p>
                                <p className="text-slate-700 dark:text-gray-300">{exp.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-16 mb-8 text-center">Education & Certifications</h3>
                <div className="relative border-l-2 border-slate-200 dark:border-gray-700 ml-4 md:ml-0">
                    <div className="mb-12">
                        <div className="absolute -left-4 md:-left-5 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-gray-900">
                            <GraduationCapIcon className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="ml-10 md:ml-12">
                            <h4 className="text-xl font-bold text-teal-600 dark:text-teal-400">{education.degree}</h4>
                            <p className="text-slate-500 dark:text-gray-400 mb-2">{education.institution} | Graduated {education.year}</p>
                            <p className="text-slate-700 dark:text-gray-300">CGPA: {education.cgpa}</p>
                        </div>
                    </div>
                    <div>
                        <div className="absolute -left-4 md:-left-5 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-gray-900">
                            <CodeIcon className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="ml-10 md:ml-12">
                            <h4 className="text-xl font-bold text-teal-600 dark:text-teal-400">Certifications</h4>
                            <ul className="list-disc list-inside text-slate-700 dark:text-gray-300 mt-2 space-y-1">
                                {certifications.map(cert => <li key={cert}>{cert}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const MatchAnalyzer = ({ onAnalyze }) => {
    const [jobDescription, setJobDescription] = useState('');

    const handleAnalyzeClick = () => {
        // For the public demo, we always trigger the onAnalyze function
        // to show the API limit notification.
        onAnalyze(jobDescription);
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg shadow-2xl mt-12 max-w-4xl mx-auto border border-teal-500/20 dark:border-teal-500/30">
            <h3 className="text-2xl font-bold text-center text-teal-600 dark:text-teal-400 mb-4 flex items-center justify-center space-x-3">
                <SparklesIcon className="w-6 h-6" />
                <span>✨ Recruiter Match Analyzer</span>
            </h3>
            <p className="text-center text-slate-500 dark:text-gray-400 mb-6">
                Hiring? Paste a job description below to see how my skills align with your needs.
            </p>
            <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                className="w-full h-40 p-4 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-md text-slate-700 dark:text-gray-300 focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
            ></textarea>
            <div className="text-center mt-6">
                <button
                    onClick={handleAnalyzeClick}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
                >
                    <span>Analyze Fit</span>
                </button>
            </div>
        </div>
    );
};


const Contact = ({ email, github, linkedin, onAnalyze }) => (
    <section id="contact" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Get In Touch</h2>
            <div className="w-20 h-1 bg-teal-500 dark:bg-teal-400 mx-auto mb-8"></div>
            <p className="text-slate-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                I'm currently seeking new opportunities and would love to hear from you. Whether you have a question or just want to say hi, feel free to reach out.
            </p>
            <a href={`mailto:${email}`} className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg text-lg">
                Say Hello
            </a>
            <div className="flex justify-center space-x-6 mt-12">
                <a href={github} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"><GithubIcon className="w-8 h-8" /></a>
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"><LinkedinIcon className="w-8 h-8" /></a>
                <a href={`mailto:${email}`} className="text-slate-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"><MailIcon className="w-8 h-8" /></a>
            </div>
            <MatchAnalyzer onAnalyze={onAnalyze} />
        </div>
    </section>
);

const Footer = ({ name }) => (
    <footer className="bg-slate-100 dark:bg-gray-900 py-8 text-slate-500 dark:text-gray-400">
        <div className="container mx-auto px-4 sm:px-6 text-center">
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Built With</h4>
                <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 text-slate-600 dark:text-gray-400">
                    <span className="text-teal-600 dark:text-teal-400">React.js</span>
                    <span className="text-teal-600 dark:text-teal-400">Tailwind CSS</span>
                    <span className="text-teal-600 dark:text-teal-400">Gemini API</span>
                    <span className="text-teal-600 dark:text-teal-400">Firebase</span>
                </div>
            </div>
            <div className="border-t border-slate-200 dark:border-gray-700 pt-6 mt-6">
                <p>&copy; {new Date().getFullYear()} {name}. All Rights Reserved.</p>
                <p className="text-sm mt-2">Designed & Built by Kishore M M</p>
            </div>
        </div>
    </footer>
);

// --- Main App Component ---
export default function App() {
    const [visitorCount, setVisitorCount] = useState(null);
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [theme, setTheme] = useState('dark');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showApiLimitModal, setShowApiLimitModal] = useState(false);
    
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Initialize Firebase and Auth
    useEffect(() => {
        if (Object.keys(firebaseConfig).length > 0) {
            try {
                const app = initializeApp(firebaseConfig);
                const firestore = getFirestore(app);
                const authInstance = getAuth(app);
                setDb(firestore);

                onAuthStateChanged(authInstance, (user) => {
                    if (user) {
                        setIsAuthReady(true);
                    } else {
                        // eslint-disable-next-line no-undef
                        const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                        if (initialToken) {
                            signInWithCustomToken(authInstance, initialToken).catch(() => signInAnonymously(authInstance));
                        } else {
                            signInAnonymously(authInstance);
                        }
                    }
                });
            } catch (error) {
                console.error("Firebase initialization error:", error);
            }
        }
    }, []);

    // Function to update and fetch visitor count
    const updateVisitorCount = useCallback(async () => {
        if (!db || !isAuthReady) return;
        const counterDocRef = doc(db, `artifacts/${appId}/public/data/visitorCounter/count`);
        try {
            // --- DATABASE WRITE OPERATION DISABLED FOR PUBLIC DEMO ---
            // To re-enable, uncomment the line below. This will increment the
            // visitor count in your Firebase database on each page load.
            // await setDoc(counterDocRef, { count: increment(1), lastUpdated: serverTimestamp() }, { merge: true });
            
            const docSnap = await getDoc(counterDocRef);
            if (docSnap.exists()) {
                setVisitorCount(docSnap.data().count);
            } else {
                setVisitorCount(1); // Set a default for the demo
            }
        } catch (error) {
            console.error("Error fetching visitor count:", error);
            setVisitorCount(1); // Set a default on error for the demo
        }
    }, [db, isAuthReady]);

    useEffect(() => {
        if (isAuthReady) {
            updateVisitorCount();
        }
    }, [isAuthReady, updateVisitorCount]);

    const handleApiFeatureClick = () => {
        setShowApiLimitModal(true);
    };

    const handleGenerateSummary = async () => {
        handleApiFeatureClick();
        // --- GEMINI API CALL DISABLED FOR PUBLIC DEMO ---
        // To re-enable this feature:
        // 1. Add your Gemini API key to the `apiKey` constant at the top of the file.
        // 2. Comment out the line `handleApiFeatureClick();` above.
        // 3. Uncomment the entire `try...catch...finally` block below.
        /*
        setIsLoading(true);
        setModalTitle("✨ AI-Powered Summary");
        setModalContent("Generating new perspectives...");
        setIsModalOpen(true);

        const prompt = `You are a professional career coach. Rewrite the following professional summary in two different styles:\n1. A more conversational and engaging paragraph.\n2. A list of 3-4 key strengths as bullet points.\n\nOriginal Summary:\n---\n${portfolioData.summary}\n\nFormat your response using Markdown for headers and bullet points.`;

        try {
            const result = await askGemini(prompt);
            setModalContent(result);
        } catch (error) {
            setModalContent("Sorry, I couldn't generate a summary at this time. Please try again later.");
        } finally {
            setIsLoading(false);
        }
        */
    };

    const handleAnalyzeFit = async (jobDescription) => {
        handleApiFeatureClick();
        // --- GEMINI API CALL DISABLED FOR PUBLIC DEMO ---
        // To re-enable this feature:
        // 1. Add your Gemini API key to the `apiKey` constant at the top of the file.
        // 2. Comment out the line `handleApiFeatureClick();` above.
        // 3. Uncomment the entire `try...catch...finally` block below.
        /*
        setIsLoading(true);
        setModalTitle("✨ Analyzing Your Fit");
        setModalContent("Comparing your profile with the job description...");
        setIsModalOpen(true);

        const prompt = `You are an expert AI recruiting assistant. Your task is to analyze the following candidate profile against the provided job description. Highlight the top 3-5 reasons why the candidate is a strong match for the role. Focus on aligning the candidate's skills, projects, and experience with the job requirements. Be specific and use evidence from the candidate's profile.\n\nCandidate Profile:\n---\n${JSON.stringify(portfolioData, null, 2)}\n\nJob Description:\n---\n${jobDescription}\n\nPresent your analysis as a concise, professional summary using Markdown for formatting. Start with a heading like 'Top Reasons for a Strong Match'.`;

        try {
            const result = await askGemini(prompt);
            setModalContent(result);
        } catch (error) {
            setModalContent("Sorry, I couldn't perform the analysis at this time. Please try again later.");
        } finally {
            setIsLoading(false);
        }
        */
    };

    return (
        <div className="bg-white dark:bg-gray-900 font-sans leading-normal tracking-normal transition-colors duration-300">
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main>
                <Hero data={portfolioData} visitorCount={visitorCount} />
                <About summary={portfolioData.summary} onGenerateSummary={handleGenerateSummary} />
                <Skills skills={portfolioData.skills} />
                <Projects projects={portfolioData.projects} />
                <Experience
                    experience={portfolioData.experience}
                    education={portfolioData.education}
                    certifications={portfolioData.certifications}
                />
                <Contact
                    email={portfolioData.email}
                    github={portfolioData.github}
                    linkedin={portfolioData.linkedin}
                    onAnalyze={handleAnalyzeFit}
                />
            </main>
            <Footer name={portfolioData.name} />
            <ApiLimitNotification 
                isOpen={showApiLimitModal} 
                onClose={() => setShowApiLimitModal(false)} 
            />
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
            >
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: modalContent.replace(/\n/g, '<br />') }} />
                )}
            </Modal>
        </div>
    );
}
