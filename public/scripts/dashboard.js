if (
    document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
    main();
} else {
    document.addEventListener("DOMContentLoaded", main);
}

function main() {
    const form = document.querySelector("#serial-form");
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(this);
        let [[serial, serialValue], [client, clientValue]] = [...formData];

        //post the grabbed datas
        try {
            const response = await fetch('/addserial', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ serial: serialValue, client: clientValue })
            });
            const data = await response.json();
            data.success ? window.location.reload() : writeFlashMessage(data.error);
        } catch (error) {
            console.log(error)
        }
    });
}


function writeFlashMessage(message) {
    const messageBoard = document.querySelector('#flash-message');
    messageBoard.innerHTML = message;
    messageBoard.classList.add('information-visible');
    setTimeout(function () {
        messageBoard.classList.remove('information-visible');
    }, 3000);
}