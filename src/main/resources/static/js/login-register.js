function loginSetup() {
    var request = new XMLHttpRequest ();
    request.open ('HEAD', document.location, false);
    request.send (null);
    document.getElementById('csrf').setAttribute('value', request.getResponseHeader('CSRF-Token'));
    console.log(request.getResponseHeader('CSRF-Token'));
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    document.getElementById('f').setAttribute('action', '/login' + (urlParams.get('redirect') ? '?redirect=' + urlParams.get('redirect') : ''));
    document.getElementById('reg').setAttribute('href', '/registration' + (urlParams.get('redirect') ? '?redirect=' + urlParams.get('redirect') : ''));
}

function registerSetup() {
    var request = new XMLHttpRequest ();
    request.open ('HEAD', document.location, false);
    request.send (null);
    document.getElementById('csrf').setAttribute('value', request.getResponseHeader('CSRF-Token'));
    console.log(request.getResponseHeader('CSRF-Token'));
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    document.getElementById('f').setAttribute('action', '/registration' + (urlParams.get('redirect') ? '?redirect=' + urlParams.get('redirect') : ''));
    document.getElementById('login').setAttribute('href', '/login' + (urlParams.get('redirect') ? '?redirect=' + urlParams.get('redirect') : ''));
}