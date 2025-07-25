// Dashboard page

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import '../assets/css/dashboard.css'

import SidePanel from "../components/sidePanel";
import Name from "../components/name";
import IntroBlock from "../components/introBlock";
import ModuleName from "../components/moduleName";
import QuestionButton from "../components/questionButton";
import TestButton from "../components/testButton";

import book from "../assets/images/book.svg"

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const modulesData = [
    {
        name: "Consent Form",
        type: "test", // This is a test, so redirect
        route: "/consent-form"
    },
    {
        name: "CIT 111 Module 1: Control structures",
        type: "module",
        questions: [
            { text: "Question 1", questionType: "tutor" },
            { text: "Question 2", questionType: "tutor" },
            { text: "Question 3", questionType: "tutor" },
            { text: "Question 4", questionType: "tutor" },
            { text: "Question 5", questionType: "mcq" }, // Multiple-choice question
        ]
    },
    {
        name: "CIT 111 Module 2: Loops",
        type: "module",
        questions: [
            { text: "Question 1", questionType: "tutor" },
            { text: "Question 2", questionType: "tutor" },
            { text: "Question 3", questionType: "tutor" },
            { text: "Question 4", questionType: "tutor" },
            { text: "Question 5", questionType: "tutor" },
            { text: "Question 6", questionType: "tutor" },
            { text: "Question 7", questionType: "tutor" },
            { text: "Question 8", questionType: "tutor" },
            { text: "Question 9", questionType: "mcq" }, //multiple type question
            { text: "Question 10", questionType: "mcq" },//multiple type question
            { text: "Question 11", questionType: "mcq" },//multiple type question
            { text: "Question 12", questionType: "mcq" },//multiple type question
        ]
    },
    {
        name: "CIT 111 Module 3: Methods",
        type: "module",
        questions: [
            { text: "Question 1", questionType: "tutor" },
            { text: "Question 2", questionType: "tutor" },
            { text: "Question 3", questionType: "tutor" },
            { text: "Question 4", questionType: "tutor" },
            { text: "Question 5", questionType: "tutor" },
        ]
    },
];

const Dashboard = () => {
    const [activeModule, setActiveModule] = useState(null);
    const [studentId, setStudentId] = useState("");
    const [hasConsent, setHasConsent] = useState(false); // Store consent status
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState("");
    const [showMessage, setShowMessage] = useState(true);
    const [successMessageTest, setSuccessMessageTest] = useState("");
    const [showMessageTest, setShowMessageTest] = useState(false);
    const sessionId = localStorage.getItem("sessionId");

    const timer = setTimeout(() => {
        setSuccessMessage((prev) => (prev ? "hidden" : ""));
        setTimeout(() => setSuccessMessage(""), 1000); // Fully remove after fade out
    }, 5000);

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to the top

        const consentMsg = sessionStorage.getItem("consentSuccessMessage");
        const testMsg = localStorage.getItem("testSuccessMessage");

        // Display the consent or test submission message
        if (consentMsg) {
            setSuccessMessage(consentMsg);
            setShowMessage(true);
            sessionStorage.removeItem("consentSuccessMessage");

            setTimeout(() => setShowMessage(false), 4000);
            setTimeout(() => setSuccessMessage(""), 5000);
        }

        if (testMsg) {
            setSuccessMessageTest(testMsg);
            setShowMessageTest(true);
            localStorage.removeItem("testSuccessMessage");

            setTimeout(() => setShowMessageTest(false), 4000);
            setTimeout(() => setSuccessMessageTest(""), 5000);
        }
    }, []);

    useEffect(() => {
        let storedStudentId = sessionStorage.getItem("studentId");

        if (!storedStudentId) {
            const queryParams = new URLSearchParams(location.search);
            storedStudentId = queryParams.get("studentId");

            if (storedStudentId) {
                sessionStorage.setItem("studentId", storedStudentId); // ✅ Save it in session
            }
        }

        if (!storedStudentId) {
            navigate("/"); // ✅ Redirect to login if missing
        } else {
            setStudentId(storedStudentId);
        }
    }, [navigate, location.search]);

    useEffect(() => {
        if (!studentId) return;

        const fetchConsentStatus = async () => {
            try {
                // Check if consent was filled
                const response = await fetch(`${BASE_URL}/api/checkConsent/${studentId}`);
                if (!response.ok) throw new Error("Failed to fetch consent status");

                const data = await response.json();
                setHasConsent(data.hasConsent);
            } catch (error) {
                console.error("Error checking consent status:", error);
            }
        };

        fetchConsentStatus();
    }, [studentId]);
    const handleModuleClick = (index, module) => {
        if (module.type === "test") {
            navigate(module.route); // Redirect for test modules
        } else {
            // Opening the questions underneath
            setActiveModule(prev => (prev === index ? null : index)); // Toggle dropdown for other modules
        }
    };

    const queryParams = new URLSearchParams(location.search);

    const [studentName, setStudentName] = useState("");
    const [studentGroup, setStudentGroup] = useState("");

    const [preTestCompleted, setPreTestCompleted] = useState({}); // ✅ Track pre-test completion per module

    const initializeCompletedQuestions = () => {
        const initialState = {};
        modulesData.forEach((module, index) => {
            initialState[index] = []; // ✅ Ensure every module starts with an empty array
        });
        return initialState;
    };

    const [completedQuestions, setCompletedQuestions] = useState(initializeCompletedQuestions);

    useEffect(() => {
        if (!studentId) return;

        const fetchTestProgress = async () => {
            try {
                // Check if the pre-test is completed and the post test
                const response = await fetch(`${BASE_URL}/api/student-test-progress/${studentId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch test progress");
                }
                const progressData = await response.json();
                console.log("Student test progress:", progressData.tests);

                // ✅ Create an object tracking pre-test completion for each module
                const preTestStatus = {};
                modulesData.forEach((module, index) => {
                    const testField = `pre-test-${index}`;
                    preTestStatus[index] = progressData.tests?.[testField] || false; // Check if pre-test exists
                });

                setPreTestCompleted(preTestStatus);
            } catch (error) {
                console.error("Error fetching pre-test progress:", error);
            }
        };

        const fetchCompletedQuestions = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/student-progress/${studentId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch progress");
                }

                let completedData = await response.json();

                // ✅ Filter out empty strings or invalid data
                completedData = completedData.filter(q => typeof q === "object" && q.moduleId !== undefined && q.questionId !== undefined);

                // ✅ Ensure all questions in a module are completed before unlocking post-test
                const completedStatus = {};
                modulesData.forEach((module, index) => {
                    if (!module.questions || !Array.isArray(module.questions)) {
                        console.warn(`Module ${index} (${module.name}) has no questions array`);
                        completedStatus[index] = false; // Assume incomplete if no questions
                        return;
                    }

                    // Get the list of completed questions for this module
                    const completedQuestions = completedData
                        .filter(q => String(q.moduleId) === String(index))
                        .map(q => String(q.questionId));

                    // ✅ Ensure all questions in the module are completed
                    const allQuestionsDone = module.questions.every((_, qIndex) =>
                        completedQuestions.includes(String(qIndex + 1))
                    );

                    completedStatus[index] = allQuestionsDone;
                });
                setCompletedQuestions((prev) => ({ ...prev, ...completedStatus }));
            } catch (error) {
                console.error("Error fetching completed questions:", error);
            }
        };

        fetchTestProgress();
        fetchCompletedQuestions();
    }, [studentId]); // ✅ Fetch on studentId change


    const handlePreTestCompletion = (moduleId) => {
        setPreTestCompleted((prev) => ({
            ...prev,
            [moduleId]: true, // ✅ Update state in real-time
        }));
    };

    const handleQuestionCompletion = (moduleId, questionId) => {
        if (questionId === undefined || questionId === null) {
            console.error(`Invalid questionId detected for module ${moduleId}:`, questionId);
            return; // Stop execution if questionId is invalid
        }

        setCompletedQuestions((prev) => {
            const totalQuestions = modulesData[moduleId]?.questions?.length || 0;

            // ✅ Ensure completedQuestions[moduleId] is always an array
            const completedInModule = Array.isArray(prev[moduleId]) ? [...prev[moduleId]] : [];

            // ✅ Add the question only if not already present
            if (!completedInModule.includes(questionId)) {
                completedInModule.push(questionId);
            }

            // ✅ Check if all questions are done
            const allQuestionsDone = completedInModule.length === totalQuestions;
            return {
                ...prev,
                [moduleId]: allQuestionsDone ? ["ALL_DONE"] : completedInModule, // ✅ Always an array
            };
        });
    };

    useEffect(() => {
        if (!studentId) return; // Don't fetch if no studentId is provided

        const fetchStudentName = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/student/${studentId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch student data");
                }
                const data = await response.json();
                setStudentName(data.name); // Update state with fetched name
                setStudentGroup(data.type);
            } catch (error) {
                console.error("Error fetching student data:", error);
                setStudentName("Unknown Student"); // Fallback if error occurs
            }
        };

        fetchStudentName();
    }, [studentId]);

    console.log("Completed Questions:", completedQuestions);
    return (
        <div className="dashboard">
            <div className="sidePanelDiv">
                <SidePanel />
            </div>
            <div className="content">
                {successMessage && (
                    <div className={`success-message ${showMessage ? "visible" : "fade-out"}`}>
                        {successMessage}
                    </div>
                )}
                {successMessageTest && (
                    <div className={`success-message ${showMessageTest ? "visible" : "fade-out"}`}>
                        {successMessageTest}
                    </div>
                )}


                <Name name={studentName} />
                <IntroBlock title="Java Tutor" content="The Java Tutor can give you adaptive feedback and run your code in the environment. You can also chat with the tutor to ask for more hints and feedback!" />
                <div className="modulesTitle">
                    <div className="bookIcon"><img src={book} alt="book" /></div>
                    <div>
                        <p className="inter-regular">Tutor Modules</p>
                    </div>
                </div>
                <div className="divider"></div>
                <div className="modules">
                    {modulesData.map((module, index) => (
                        <div key={index}>
                            <div
                                onClick={() => handleModuleClick(index, module)}
                                className={`moduleButton ${!hasConsent && module.type !== "test" ? "disabled" : ""}`}
                            >
                                <ModuleName name={module.name} />
                            </div>

                            {/* Show questions only when a module is clicked */}
                            {activeModule === index && module.type === "module" && hasConsent && (
                                <div className="questions">
                                    <TestButton studentId={studentId} moduleId={index} type="pre-test" onPreTestComplete={handlePreTestCompletion} setSuccessMessageTest={setSuccessMessageTest}
                                        setShowMessageTest={setShowMessageTest} />

                                    {module.questions.map((question, qIndex) => (
                                        <QuestionButton
                                            key={qIndex}
                                            studentId={studentId} // Pass studentId
                                            moduleId={index}
                                            questionId={qIndex + 1}
                                            question={question}
                                            type={studentGroup}
                                            isDisabled={!preTestCompleted[index]}
                                            onQuestionComplete={() => handleQuestionCompletion(index, qIndex + 1)}

                                        />
                                    ))}

                                    <TestButton studentId={studentId} moduleId={index} type="post-test" isDisabled={
                                        !preTestCompleted[index] ||
                                        !(Array.isArray(completedQuestions[index]) && completedQuestions[index].includes("ALL_DONE"))
                                    } setSuccessMessageTest={setSuccessMessageTest}
                                        setShowMessageTest={setShowMessageTest} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Dashboard