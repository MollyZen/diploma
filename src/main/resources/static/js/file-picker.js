function createAndRedirect() {
    /*const request = new Request("/new-file", {
        method: "GET",
    });
    request.redirect;*/
    window.location.href = "/new-file"
    /*window.location.replace("http://localhost:8082/new-file");*/
}

function setup() {
    document.getElementById('create-file').addEventListener('click', (ev) => {
        createAndRedirect();
    });
    const userAction = async () => {
        const response = await fetch('/rest/getDisplayname');
        const res = await response.text();
        if (res != null && res !== ''){
            document.getElementById('login-button').hidden = "hidden";
            document.getElementById('image').hidden = null;
            document.getElementById('displayname').hidden = null;
            document.getElementById('displayname').textContent = res;
            document.getElementById('currentImage').textContent = res.slice(0, 1);
        }
    };
    userAction.apply();
}