if (
    document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
    main();
} else {
    document.addEventListener("DOMContentLoaded", main);
}

function main() {
    const loginForm = document.querySelector('#login');
    const registrationForm = document.querySelector('#registration');

    loginForm.addEventListener('submit', loginFormSubmitted);
    registrationForm.addEventListener('submit', registrationFormSubmitted);
}

//Form event listeners

async function loginFormSubmitted(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const [[name, emailValue], [password, passwordValue]] = [...formData];
    try {
        const response = await fetch('/login', {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailValue, password: passwordValue })
        });
        const data = await response.json();
        data.success ? writeMessage("Request successful", "successDisplay") :
            writeMessage("Request Failed", "errorDisplay");
    } catch (error) {
        writeMessage("Request failed at the front", "errorDisplay")
    }
}


async function registrationFormSubmitted(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const [[name, nameValue], [password, passwordValue], [email, emailValue], [confirm, confirmValue]] = [...formData];
    try {
        const response = await fetch('/register', {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: nameValue, email: emailValue, password: passwordValue, confirm: confirmValue })
        });
        const data = await response.json();
        data.success ? writeMessage("Request successful", "successDisplay") :
            writeMessage("Request Failed", "errorDisplay");
    } catch (error) {
        writeMessage("Request failed at the front", "errorDisplay")
    }
}

function writeMessage(message, messageType) {
    const messageBoard = document.querySelector('#messageDisplay');
    messageBoard.textContent = message;
    messageBoard.classList.add(messageType);
    setTimeout(() => {
        messageBoard.classList.remove(messageType)
    }, 2000)
}
