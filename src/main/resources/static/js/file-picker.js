function createAndRedirect() {
    /*const request = new Request("/new-file", {
        method: "GET",
    });
    request.redirect;*/
    window.location.href = "http://localhost:8082/new-file"
    /*window.location.replace("http://localhost:8082/new-file");*/
}

$(function () {
    $('#create-file').click(function() { createAndRedirect(); });
});