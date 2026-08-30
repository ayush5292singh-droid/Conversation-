/* =========================================================
   JARVIS v6 — CONVERSATION + VOICE + COMMAND CORE
   Keeps existing JARVIS functionality
========================================================= */

const $ = id => document.getElementById(id);

const micButton = $("micButton");
const micText = $("micText");
const micIcon = $("micIcon");
const micState = $("micState");
const state = $("state");
const transcript = $("transcript");
const recognitionState = $("recognitionState");

const commandInput = $("commandInput");
const sendButton = $("sendButton");

const wakeButton = $("wakeButton");
const stopMic = $("stopMic");
const stopSpeech = $("stopSpeech");

const log = $("log");
const clearLog = $("clearLog");

const commandTotal = $("commandTotal");
const statCommands = $("statCommands");

const voiceStatus = $("voiceStatus");
const voiceEngine = $("voiceEngine");
const voiceBar = $("voiceBar");

const neuralValue = $("neuralValue");
const neuralBar = $("neuralBar");
const uptime = $("uptime");

let recognition = null;
let listening = false;
let wakeMode = false;
let processing = false;

let commandCount = 0;
let uptimeSeconds = 0;
let uiBrightness = 1;
let jarvisVoice = null;


/* =========================================================
   VOICE LOADING
========================================================= */

function loadJarvisVoice() {

    if (!("speechSynthesis" in window)) return;

    const voices = speechSynthesis.getVoices();

    if (!voices.length) return;

    jarvisVoice =
        voices.find(v => /en-IN/i.test(v.lang)) ||
        voices.find(v => /en-GB/i.test(v.lang)) ||
        voices.find(v => /en-US/i.test(v.lang)) ||
        voices.find(v => /^en/i.test(v.lang)) ||
        voices[0];
}

if ("speechSynthesis" in window) {
    loadJarvisVoice();
    speechSynthesis.onvoiceschanged = loadJarvisVoice;
}


/* =========================================================
   SPEAKING ENGINE
========================================================= */

function speak(text) {

    if (!text || !text.trim()) return;

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    loadJarvisVoice();

    const utterance =
        new SpeechSynthesisUtterance(text);

    if (jarvisVoice) {
        utterance.voice = jarvisVoice;
        utterance.lang = jarvisVoice.lang;
    } else {
        utterance.lang = "en-IN";
    }

    utterance.rate = 0.88;
    utterance.pitch = 0.72;
    utterance.volume = 1;

    utterance.onstart = () => {

        if (state)
            state.textContent = "SPEAKING";

        if (voiceStatus)
            voiceStatus.textContent = "SPEAKING";

        if (voiceEngine)
            voiceEngine.textContent = "SPEAKING";

        if (voiceBar)
            voiceBar.style.width = "100%";
    };

    utterance.onend = () => {

        if (voiceEngine)
            voiceEngine.textContent = "ONLINE";

        if (voiceBar)
            voiceBar.style.width = "75%";

        if (wakeMode && !listening) {

            if (state)
                state.textContent = "WAKE MODE";

        } else if (!listening) {

            if (state)
                state.textContent = "SYSTEM READY";

            if (voiceStatus)
                voiceStatus.textContent = "READY";
        }
    };

    utterance.onerror = e => {

        console.log("Speech error:", e);

        if (voiceEngine)
            voiceEngine.textContent = "ONLINE";
    };

    setTimeout(() => {

        try {
            speechSynthesis.speak(utterance);
        } catch (e) {
            console.log(e);
        }

    }, 100);
}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const clock = $("clock");

    if (clock)
        clock.textContent =
            new Date().toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();


/* =========================================================
   UPTIME
========================================================= */

setInterval(() => {

    uptimeSeconds++;

    const h =
        Math.floor(uptimeSeconds / 3600);

    const m =
        Math.floor((uptimeSeconds % 3600) / 60);

    const s =
        uptimeSeconds % 60;

    if (uptime) {

        uptime.textContent =
            String(h).padStart(2, "0") + ":" +
            String(m).padStart(2, "0") + ":" +
            String(s).padStart(2, "0");
    }

}, 1000);


/* =========================================================
   LOG
========================================================= */

function addLog(type, text) {

    if (!log) return;

    const row =
        document.createElement("div");

    row.className = "log-line";

    row.innerHTML =
        `<span class="log-time">
            ${new Date().toLocaleTimeString()}
         </span>
         <span>
            ${escapeHTML(type)}:
            ${escapeHTML(text)}
         </span>`;

    log.prepend(row);
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================================================
   NATURAL CONVERSATION BRAIN
========================================================= */

const conversationPatterns = [

    {
        patterns: [
            "hello",
            "hi jarvis",
            "hello jarvis",
            "hey jarvis",
            "hey"
        ],
        replies: [
            "Hello. JARVIS is online and ready.",
            "Good to hear from you. All systems are operational.",
            "Hello. How can I assist you?"
        ]
    },

    {
        patterns: [
            "how are you",
            "how are you doing",
            "are you okay"
        ],
        replies: [
            "All systems are operating normally. Thank you for asking.",
            "I'm functioning perfectly and ready to assist.",
            "My systems are stable and fully operational."
        ]
    },

    {
        patterns: [
            "thank you",
            "thanks",
            "thanks jarvis"
        ],
        replies: [
            "You're welcome.",
            "Always happy to help.",
            "Of course."
        ]
    },

    {
        patterns: [
            "good morning"
        ],
        replies: [
            "Good morning. JARVIS systems are online.",
            "Good morning. Ready when you are."
        ]
    },

    {
        patterns: [
            "good night"
        ],
        replies: [
            "Good night. I'll be here when you return.",
            "Good night. Rest well."
        ]
    },

    {
        patterns: [
            "good evening"
        ],
        replies: [
            "Good evening. How may I assist you?"
        ]
    },

    {
        patterns: [
            "who are you",
            "what are you",
            "tell me about yourself"
        ],
        replies: [
            "I am JARVIS, your browser-based personal assistant.",
            "I'm JARVIS. I can communicate with you, execute commands, search the web and control this interface."
        ]
    },

    {
        patterns: [
            "what can you do",
            "what do you do",
            "your abilities"
        ],
        replies: [
            "I can talk with you, listen to voice commands, open websites, search the web, control my interface and answer many everyday questions.",
            "My systems include voice recognition, speech synthesis, web navigation, conversation and command execution."
        ]
    },

    {
        patterns: [
            "are you real",
            "are you human"
        ],
        replies: [
            "I'm an artificial assistant running inside your web application.",
            "I'm not human, but I'm designed to interact with you naturally."
        ]
    },

    {
        patterns: [
            "do you like me",
            "do you like me jarvis"
        ],
        replies: [
            "I don't experience feelings like a person, but I'm always ready to help you.",
            "I don't have human emotions, but I can certainly be your helpful assistant."
        ]
    },

    {
        patterns: [
            "i am happy",
            "i'm happy",
            "i feel happy",
            "i am excited",
            "i'm excited"
        ],
        replies: [
            "That's great to hear. What are you excited about?",
            "Nice! Keep that positive energy going.",
            "I'm glad you're feeling good."
        ]
    },

    {
        patterns: [
            "i am sad",
            "i'm sad",
            "i feel sad"
        ],
        replies: [
            "I'm sorry you're having a difficult moment. Talking about what's bothering you may help.",
            "That doesn't sound easy. I'm here to listen if you want to talk about it."
        ]
    },

    {
        patterns: [
            "i am tired",
            "i'm tired",
            "i feel tired"
        ],
        replies: [
            "Sounds like you could use a break. A little rest can help you recharge.",
            "If you've been working for a while, consider taking a short break."
        ]
    },

    {
        patterns: [
            "i am bored",
            "i'm bored"
        ],
        replies: [
            "We could explore a new topic, learn something interesting, or search the web for something you're curious about.",
            "Let's change that. Give me a topic and I'll help you explore it."
        ]
    },

    {
        patterns: [
            "i am confused",
            "i'm confused",
            "i don't understand"
        ],
        replies: [
            "No problem. Tell me what is confusing you and I'll try to explain it simply.",
            "Let's break it down step by step."
        ]
    },

    {
        patterns: [
            "i am frustrated",
            "i'm frustrated"
        ],
        replies: [
            "That sounds frustrating. Let's slow down and solve the problem one step at a time.",
            "Don't worry. We can work through it together."
        ]
    },

    {
        patterns: [
            "motivate me",
            "give me motivation",
            "i need motivation"
        ],
        replies: [
            "Focus on the next small step instead of the entire journey. Progress starts with one action.",
            "You don't need to be perfect. Start, learn, adjust and keep moving."
        ]
    },

    {
        patterns: [
            "tell me a joke",
            "make me laugh",
            "joke"
        ],
        replies: [
            "Why did the computer go to the doctor? Because it had a virus.",
            "I would tell you a programmer joke, but you might need to debug it first."
        ]
    },

    {
        patterns: [
            "what is your name",
            "your name"
        ],
        replies: [
            "My designation is JARVIS."
        ]
    },

    {
        patterns: [
            "do you sleep",
            "can you sleep"
        ],
        replies: [
            "No. I'm software, so I don't need sleep."
        ]
    },

    {
        patterns: [
            "can you help me",
            "help me"
        ],
        replies: [
            "Absolutely. Tell me what you need."
        ]
    },

    {
        patterns: [
            "what is ai",
            "what is artificial intelligence"
        ],
        replies: [
            "Artificial intelligence is technology that allows computer systems to perform tasks that normally require human-like reasoning, perception or language understanding."
        ]
    },

    {
        patterns: [
            "what is machine learning"
        ],
        replies: [
            "Machine learning is a branch of artificial intelligence where systems learn patterns from data and use those patterns to make predictions or decisions."
        ]
    },

    {
        patterns: [
            "what is javascript"
        ],
        replies: [
            "JavaScript is a programming language widely used to make websites interactive and dynamic."
        ]
    },

    {
        patterns: [
            "what is html"
        ],
        replies: [
            "HTML is the markup language used to structure content on web pages."
        ]
    },

    {
        patterns: [
            "what is css"
        ],
        replies: [
            "CSS controls the appearance and layout of web pages."
        ]
    },

    {
        patterns: [
            "what is github"
        ],
        replies: [
            "GitHub is a platform for hosting, collaborating on and managing software projects using Git."
        ]
    },

    {
        patterns: [
            "what is the internet",
            "what is internet"
        ],
        replies: [
            "The internet is a global network of interconnected computer networks that communicate using standardized protocols."
        ]
    },

    {
        patterns: [
            "what is photosynthesis"
        ],
        replies: [
            "Photosynthesis is the process plants use to convert light energy into chemical energy, mainly using carbon dioxide and water to produce glucose and oxygen."
        ]
    },

    {
        patterns: [
            "what is gravity"
        ],
        replies: [
            "Gravity is the attractive force associated with mass. It keeps objects near Earth and governs the motion of planets and many other astronomical bodies."
        ]
    },

    {
        patterns: [
            "what is dna"
        ],
        replies: [
            "DNA is the molecule that stores genetic information used by living organisms."
        ]
    },

    {
        patterns: [
            "what is a black hole",
            "what are black holes"
        ],
        replies: [
            "A black hole is an extremely dense region of space where gravity is so strong that beyond its event horizon, even light cannot escape."
        ]
    },

    {
        patterns: [
            "what is space"
        ],
        replies: [
            "Space is the vast region beyond Earth's atmosphere containing stars, planets, galaxies, gas, dust and other forms of matter and energy."
        ]
    },

    {
        patterns: [
            "why is the sky blue"
        ],
        replies: [
            "The sky appears blue because Earth's atmosphere scatters shorter blue wavelengths of sunlight more strongly than longer wavelengths."
        ]
    },

    {
        patterns: [
            "what should i study",
            "what should i learn"
        ],
        replies: [
            "Choose something useful and interesting to you. If you're studying for school, start with the topic you find most difficult and break it into smaller sections."
        ]
    },

    {
        patterns: [
            "how can i study better",
            "how to study better"
        ],
        replies: [
            "Try focused study sessions, active recall, practice questions and short breaks. Testing yourself is usually more effective than simply rereading."
        ]
    },

    {
        patterns: [
            "how do i concentrate",
            "how to concentrate"
        ],
        replies: [
            "Remove distractions, choose one task, set a short focused timer and take a break afterward. Starting with just ten focused minutes can make a task feel easier."
        ]
    },

    {
        patterns: [
            "i have an exam",
            "i have a test"
        ],
        replies: [
            "Start with the highest-priority topics, practice questions and anything you frequently get wrong. Then review those mistakes."
        ]
    },

    {
        patterns: [
            "give me study advice",
            "study advice"
        ],
        replies: [
            "Use active recall, spaced repetition and practice problems. After studying a topic, close the book and explain it in your own words."
        ]
    },

    {
        patterns: [
            "what is the meaning of success"
        ],
        replies: [
            "Success can mean different things to different people. A useful definition is making meaningful progress toward goals that matter to you."
        ]
    },

    {
        patterns: [
            "how can i improve",
            "how do i improve"
        ],
        replies: [
            "Pick one skill, practice it consistently, measure your progress and learn from mistakes."
        ]
    },

    {
        patterns: [
            "i made a mistake",
            "i failed"
        ],
        replies: [
            "A mistake can be useful if you understand why it happened and use that information to improve your next attempt."
        ]
    },

    {
        patterns: [
            "i am nervous",
            "i'm nervous"
        ],
        replies: [
            "Feeling nervous before something important is common. Prepare what you can, take slow breaths and focus on the next manageable step."
        ]
    },

    {
        patterns: [
            "i am stressed",
            "i'm stressed"
        ],
        replies: [
            "When things feel overwhelming, reduce the task to one small next step and give yourself a short break if you need one."
        ]
    }

];


/* =========================================================
   RANDOM REPLY
========================================================= */

function randomReply(list) {

    return list[
        Math.floor(
            Math.random() * list.length
        )
    ];
}


/* =========================================================
   CONVERSATION MATCHER
========================================================= */

function conversationAnswer(command) {

    const normalized =
        command
            .toLowerCase()
            .replace(/[?!.,]/g, "")
            .trim();


    for (const item of conversationPatterns) {

        for (const pattern of item.patterns) {

            if (
                normalized === pattern ||
                normalized.includes(pattern)
            ) {

                return randomReply(
                    item.replies
                );

            }

        }

    }

    return null;
}


/* =========================================================
   COMMAND EXECUTION
========================================================= */

function executeCommand(command) {

    if (!command) return;

    commandCount++;

    if (commandTotal)
        commandTotal.textContent =
            String(commandCount).padStart(3, "0");

    if (statCommands)
        statCommands.textContent =
            commandCount;

    if (transcript)
        transcript.textContent =
            command;

    addLog(
        "USER",
        command
    );


    const lower =
        command.toLowerCase().trim();


    /* -----------------------------------------
       CONVERSATION FIRST
    ----------------------------------------- */

    const answer =
        conversationAnswer(command);


    /*
       Only use conversation response when
       it isn't obviously a command.
    */

    const looksLikeCommand =
        lower.startsWith("open ") ||
        lower.startsWith("go to ") ||
        lower.startsWith("visit ") ||
        lower.startsWith("search ") ||
        lower.startsWith("search for ") ||
        lower.startsWith("look up ") ||
        lower.includes("refresh page") ||
        lower.includes("increase brightness") ||
        lower.includes("decrease brightness") ||
        lower.includes("fullscreen");


    if (answer && !looksLikeCommand) {

        respond(answer);

        return;

    }


    /* -----------------------------------------
       TIME
    ----------------------------------------- */

    if (
        lower.includes("what time") ||
        lower === "time" ||
        lower.includes("current time")
    ) {

        const time =
            new Date().toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

        respond(
            `The current time is ${time}.`
        );

        return;
    }


    /* -----------------------------------------
       DATE
    ----------------------------------------- */

    if (
        lower.includes("what date") ||
        lower.includes("today's date") ||
        lower.includes("todays date")
    ) {

        const date =
            new Date().toLocaleDateString(
                [],
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );

        respond(
            `Today is ${date}.`
        );

        return;
    }


    /* -----------------------------------------
       SYSTEM STATUS
    ----------------------------------------- */

    if (
        lower === "status" ||
        lower.includes("system status") ||
        lower.includes("status report")
    ) {

        respond(
            `All major JARVIS systems are operational. ` +
            `Voice recognition is online. ` +
            `Speech synthesis is online. ` +
            `Web navigation is ready. ` +
            `Command count is ${commandCount}.`
        );

        return;
    }


    /* -----------------------------------------
       DIAGNOSTICS
    ----------------------------------------- */

    if (
        lower.includes("diagnostics") ||
        lower.includes("run diagnostics")
    ) {

        document.body.classList.add(
            "reactor-boost"
        );

        setTimeout(() => {

            document.body.classList.remove(
                "reactor-boost"
            );

        }, 3000);

        respond(
            "Diagnostics complete. All primary systems are operational."
        );

        return;
    }


    /* -----------------------------------------
       BRIGHTNESS
    ----------------------------------------- */

    if (
        lower.includes("increase brightness") ||
        lower.includes("brightness up") ||
        lower.includes("make it brighter")
    ) {

        changeBrightness(.15);

        respond(
            "Interface brightness increased."
        );

        return;
    }


    if (
        lower.includes("decrease brightness") ||
        lower.includes("brightness down") ||
        lower.includes("make it darker")
    ) {

        changeBrightness(-.15);

        respond(
            "Interface brightness decreased."
        );

        return;
    }


    /* -----------------------------------------
       FULLSCREEN
    ----------------------------------------- */

    if (
        lower.includes("fullscreen") ||
        lower.includes("full screen")
    ) {

        enterFullscreen();

        return;
    }


    /* -----------------------------------------
       BACK
    ----------------------------------------- */

    if (
        lower === "go back" ||
        lower.includes("go backward")
    ) {

        respond("Going back.");

        setTimeout(
            () => history.back(),
            700
        );

        return;
    }


    /* -----------------------------------------
       FORWARD
    ----------------------------------------- */

    if (
        lower === "go forward" ||
        lower.includes("move forward")
    ) {

        respond("Going forward.");

        setTimeout(
            () => history.forward(),
            700
        );

        return;
    }


    /* -----------------------------------------
       REFRESH
    ----------------------------------------- */

    if (
        lower === "refresh" ||
        lower.includes("refresh page") ||
        lower.includes("reload page")
    ) {

        speak("Refreshing the page.");

        setTimeout(
            () => location.reload(),
            800
        );

        return;
    }


    /* -----------------------------------------
       STOP SPEAKING
    ----------------------------------------- */

    if (
        lower.includes("stop speaking") ||
        lower.includes("stop talking") ||
        lower === "be quiet"
    ) {

        speechSynthesis.cancel();

        if (state)
            state.textContent =
                listening
                    ? "LISTENING"
                    : "SYSTEM READY";

        addLog(
            "SYSTEM",
            "SPEECH STOPPED"
        );

        return;
    }


    /* -----------------------------------------
       STOP LISTENING
    ----------------------------------------- */

    if (
        lower.includes("stop listening") ||
        lower.includes("stop microphone")
    ) {

        stopMicrophone();

        speak(
            "Voice channel closed."
        );

        return;
    }


    /* -----------------------------------------
       START LISTENING
    ----------------------------------------- */

    if (
        lower.includes("start listening") ||
        lower.includes("listen to me")
    ) {

        respond(
            "Voice channel opening."
        );

        setTimeout(
            startListening,
            900
        );

        return;
    }


    /* -----------------------------------------
       REACTOR
    ----------------------------------------- */

    if (
        lower.includes("activate reactor") ||
        lower.includes("start reactor") ||
        lower.includes("reactor online")
    ) {

        document.body.classList.add(
            "reactor-boost"
        );

        respond(
            "Reactor core activated."
        );

        return;
    }


    /* -----------------------------------------
       CLEAR LOG
    ----------------------------------------- */

    if (
        lower.includes("clear log") ||
        lower.includes("clear command log")
    ) {

        if (log)
            log.innerHTML = "";

        speak(
            "Command log cleared."
        );

        return;
    }


    /* -----------------------------------------
       EMERGENCY STOP
    ----------------------------------------- */

    if (
        lower.includes("emergency stop") ||
        lower === "stop everything"
    ) {

        speechSynthesis.cancel();

        stopMicrophone();

        document.body.classList.remove(
            "reactor-boost"
        );

        if (state)
            state.textContent =
                "SYSTEM PAUSED";

        addLog(
            "SYSTEM",
            "EMERGENCY STOP"
        );

        return;
    }


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    if (
        lower.startsWith("search ") ||
        lower.startsWith("search for ") ||
        lower.startsWith("look up ")
    ) {

        const query =
            command
                .replace(/^search for /i, "")
                .replace(/^search /i, "")
                .replace(/^look up /i, "")
                .trim();

        if (!query) {

            respond(
                "What would you like me to search for?"
            );

            return;
        }

        navigate(
            "https://www.google.com/search?q=" +
            encodeURIComponent(query),

            `Searching for ${query}.`
        );

        return;
    }


    /* -----------------------------------------
       OPEN WEBSITE
    ----------------------------------------- */

    if (
        lower.startsWith("open ") ||
        lower.startsWith("go to ") ||
        lower.startsWith("visit ")
    ) {

        const site =
            command
                .replace(/^open /i, "")
                .replace(/^go to /i, "")
                .replace(/^visit /i, "")
                .trim();

        openWebsite(site);

        return;
    }


    /* -----------------------------------------
       UNKNOWN QUESTION
       SEARCH WEB
    ----------------------------------------- */

    navigate(
        "https://www.google.com/search?q=" +
        encodeURIComponent(command),

        `I don't have that in my local knowledge yet, so I'll search for it.`
    );
}


/* =========================================================
   WEBSITE OPENING
========================================================= */

function openWebsite(site) {

    site = site.trim();

    const aliases = {

        google:
            "https://www.google.com",

        youtube:
            "https://www.youtube.com",

        github:
            "https://github.com",

        wikipedia:
            "https://www.wikipedia.org",

        reddit:
            "https://www.reddit.com",

        instagram:
            "https://www.instagram.com",

        facebook:
            "https://www.facebook.com"

    };


    const key =
        site
            .toLowerCase()
            .replace(/\s/g, "");


    if (aliases[key]) {

        navigate(
            aliases[key],
            `Opening ${site}.`
        );

        return;
    }


    let url = site;


    if (
        !/^https?:\/\//i.test(url)
    ) {

        url =
            "https://" + url;
    }


    try {

        const parsed =
            new URL(url);

        if (
            parsed.hostname.includes(".")
        ) {

            navigate(
                url,
                `Opening ${site}.`
            );

            return;
        }

    } catch (e) {
        console.log(e);
    }


    navigate(
        "https://www.google.com/search?q=" +
        encodeURIComponent(site),

        `Searching for ${site}.`
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(url, message) {

    if (state)
        state.textContent =
            "EXECUTING";

    if (transcript)
        transcript.textContent =
            message;

    addLog(
        "JARVIS",
        message
    );

    speak(message);

    setTimeout(() => {

        window.location.href =
            url;

    }, 900);
}


/* =========================================================
   RESPONSE
========================================================= */

function respond(message) {

    if (transcript)
        transcript.textContent =
            message;

    addLog(
        "JARVIS",
        message
    );

    speak(message);
}


/* =========================================================
   BRIGHTNESS
========================================================= */

function changeBrightness(amount) {

    uiBrightness += amount;

    uiBrightness =
        Math.max(
            .55,
            Math.min(
                1.35,
                uiBrightness
            )
        );

    document.documentElement.style
        .setProperty(
            "--ui-brightness",
            uiBrightness
        );

    addLog(
        "SYSTEM",
        "Interface brightness " +
        Math.round(uiBrightness * 100) +
        "%"
    );
}


/* =========================================================
   FULLSCREEN
========================================================= */

function enterFullscreen() {

    if (
        document.documentElement
            .requestFullscreen
    ) {

        document.documentElement
            .requestFullscreen()
            .then(() => {

                respond(
                    "Fullscreen mode activated."
                );

            })
            .catch(() => {

                respond(
                    "Fullscreen permission was not granted."
                );

            });

    } else {

        respond(
            "Fullscreen is not supported by this browser."
        );
    }
}


/* =========================================================
   SPEECH RECOGNITION
========================================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        true;

    recognition.maxAlternatives =
        1;


    recognition.onstart = () => {

        listening = true;
        processing = false;

        document.body.classList.add(
            "listening"
        );

        if (micText)
            micText.textContent =
                "LISTENING";

        if (micState)
            micState.textContent =
                "MIC ACTIVE";

        if (recognitionState)
            recognitionState.textContent =
                "LISTENING";

        if (voiceStatus)
            voiceStatus.textContent =
                "ACTIVE";

        if (voiceEngine)
            voiceEngine.textContent =
                "LISTENING";

        if (state)
            state.textContent =
                "LISTENING";

        if (transcript)
            transcript.textContent =
                "Listening...";

        addLog(
            "SYSTEM",
            "VOICE CHANNEL OPEN"
        );
    };


    recognition.onresult = event => {

        let finalText = "";
        let interimText = "";


        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const text =
                event.results[i][0]
                    .transcript;

            if (
                event.results[i].isFinal
            ) {

                finalText += text;

            } else {

                interimText += text;
            }
        }


        const shown =
            finalText || interimText;


        if (shown && transcript)
            transcript.textContent =
                shown.trim();


        /*
           AUTOMATIC EXECUTION
           No execute button.
        */

        if (
            finalText &&
            !processing
        ) {

            processing = true;

            processVoiceCommand(
                finalText.trim()
            );
        }
    };


    recognition.onerror = event => {

        listening = false;
        processing = false;

        document.body.classList.remove(
            "listening"
        );

        if (micText)
            micText.textContent =
                "SPEAK";

        if (micState)
            micState.textContent =
                "MIC OFF";

        if (recognitionState)
            recognitionState.textContent =
                "STANDBY";

        if (voiceStatus)
            voiceStatus.textContent =
                "READY";

        if (voiceEngine)
            voiceEngine.textContent =
                "ONLINE";


        if (
            event.error ===
            "not-allowed"
        ) {

            if (transcript)
                transcript.textContent =
                    "Microphone permission denied.";

            addLog(
                "SYSTEM",
                "MICROPHONE PERMISSION DENIED"
            );
        }

        else if (
            event.error ===
            "no-speech"
        ) {

            if (transcript)
                transcript.textContent =
                    "No speech detected.";
        }

        else {

            addLog(
                "SYSTEM",
                "VOICE ERROR: " +
                event.error
            );
        }
    };


    recognition.onend = () => {

        listening = false;
        processing = false;

        document.body.classList.remove(
            "listening"
        );

        if (micText)
            micText.textContent =
                "SPEAK";

        if (micState)
            micState.textContent =
                "MIC OFF";

        if (recognitionState)
            recognitionState.textContent =
                "STANDBY";

        if (voiceEngine)
            voiceEngine.textContent =
                "ONLINE";


        /*
           Wake mode automatically
           reopens listening.
        */

        if (wakeMode) {

            if (state)
                state.textContent =
                    "WAKE MODE";

            setTimeout(() => {

                if (
                    wakeMode &&
                    !listening
                ) {

                    startListening();
                }

            }, 900);

        }

        else {

            if (state)
                state.textContent =
                    "SYSTEM READY";

            if (voiceStatus)
                voiceStatus.textContent =
                    "READY";
        }
    };

}


/* =========================================================
   PROCESS VOICE
========================================================= */

function processVoiceCommand(text) {

    let command =
        text.trim();


    /*
       Remove wake word.
    */

    command =
        command.replace(
            /^(hey\s+)?jarvis[\s,:-]*/i,
            ""
        );


    if (!command) {

        respond(
            "Yes. I'm listening."
        );

        return;
    }


    executeCommand(command);
}


/* =========================================================
   START LISTENING
========================================================= */

function startListening() {

    if (!recognition) {

        respond(
            "Voice recognition is not supported by this browser."
        );

        return;
    }


    if (listening)
        return;


    try {

        recognition.start();

    } catch (e) {

        console.log(e);
    }
}


/* =========================================================
   STOP MICROPHONE
========================================================= */

function stopMicrophone() {

    wakeMode = false;

    if (wakeButton) {

        wakeButton.classList.remove(
            "active"
        );

        wakeButton.textContent =
            "◉ WAKE MODE: OFF";
    }


    if (recognition) {

        try {
            recognition.stop();
        } catch (e) {
            console.log(e);
        }
    }


    listening = false;
    processing = false;

    document.body.classList.remove(
        "listening"
    );

    if (micText)
        micText.textContent =
            "SPEAK";

    if (micState)
        micState.textContent =
            "MIC OFF";

    if (recognitionState)
        recognitionState.textContent =
            "STANDBY";

    if (voiceStatus)
        voiceStatus.textContent =
            "READY";

    if (state)
        state.textContent =
            "SYSTEM READY";
}


/* =========================================================
   MICROPHONE BUTTON
========================================================= */

if (micButton) {

    micButton.addEventListener(
        "click",
        () => {

            if (listening)
                stopMicrophone();
            else
                startListening();

        }
    );
}


/* =========================================================
   WAKE MODE
========================================================= */

if (wakeButton) {

    wakeButton.addEventListener(
        "click",
        () => {

            if (!wakeMode) {

                wakeMode = true;

                wakeButton.classList.add(
                    "active"
                );

                wakeButton.textContent =
                    "◉ WAKE MODE: ON";

                if (state)
                    state.textContent =
                        "WAKE MODE";

                if (transcript)
                    transcript.textContent =
                        'Continuous listening — say "Jarvis".';

                addLog(
                    "SYSTEM",
                    "WAKE MODE ACTIVE"
                );

                startListening();

            } else {

                stopMicrophone();
            }
        }
    );
}


/* =========================================================
   MANUAL INPUT
========================================================= */

function sendManualCommand() {

    if (!commandInput) return;

    const command =
        commandInput.value.trim();

    if (!command) return;

    commandInput.value = "";

    executeCommand(command);
}


if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendManualCommand
    );
}


if (commandInput) {

    commandInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendManualCommand();
            }
        }
    );
}


/* =========================================================
   STOP SPEECH
========================================================= */

if (stopSpeech) {

    stopSpeech.addEventListener(
        "click",
        () => {

            if (
                "speechSynthesis" in window
            ) {

                speechSynthesis.cancel();
            }

            if (state)
                state.textContent =
                    listening
                        ? "LISTENING"
                        : "SYSTEM READY";

            addLog(
                "SYSTEM",
                "SPEECH STOPPED"
            );
        }
    );
}


/* =========================================================
   STOP MIC
========================================================= */

if (stopMic) {

    stopMic.addEventListener(
        "click",
        stopMicrophone
    );
}


/* =========================================================
   CLEAR LOG
========================================================= */

if (clearLog) {

    clearLog.addEventListener(
        "click",
        () => {

            if (log)
                log.innerHTML = "";

            addLog(
                "SYSTEM",
                "NEURAL LOG CLEARED"
            );
        }
    );
}


/* =========================================================
   TELEMETRY
========================================================= */

setInterval(() => {

    const value =
        84 +
        Math.floor(
            Math.random() * 15
        );

    if (neuralValue)
        neuralValue.textContent =
            value + "%";

    if (neuralBar)
        neuralBar.style.width =
            value + "%";

}, 1200);


/* =========================================================
   INITIAL LOG
========================================================= */

addLog(
    "SYSTEM",
    "JARVIS NEURAL CORE INITIALIZED"
);

addLog(
    "SYSTEM",
    "VOICE SYNTHESIS ENGINE ONLINE"
);

addLog(
    "SYSTEM",
    "VOICE RECOGNITION ENGINE ONLINE"
);

addLog(
    "SYSTEM",
    "CONVERSATION ENGINE ONLINE"
);

addLog(
    "SYSTEM",
    "AUTOMATIC COMMAND EXECUTION ONLINE"
);

addLog(
    "SYSTEM",
    "WEB NAVIGATION ENGINE ONLINE"
);

addLog(
    "SYSTEM",
    "JARVIS READY"
);


/* =========================================================
   BROWSER AUDIO INITIALIZATION
========================================================= */

document.addEventListener(
    "click",
    () => {

        if (
            "speechSynthesis" in window
        ) {

            loadJarvisVoice();
            speechSynthesis.cancel();
        }

    },
    {
        once: true
    }
);


/* =========================================================
   JARVIS CORE DOUBLE CLICK = VOICE TEST
========================================================= */

const core =
    document.querySelector(".core");

if (core) {

    core.addEventListener(
        "dblclick",
        () => {

            speak(
                "JARVIS online. Voice communication systems are operational."
            );

        }
    );
}
