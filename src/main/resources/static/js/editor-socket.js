var stompClient = null;
var socket = null;

const queryString = window.location.href;
var split = queryString.split('/');
split.pop();
const fileId = split.pop();
function connect() {
    let new_conn = function() {
        socket = new SockJS('/gs-guide-websocket');
    };
    new_conn();
    stompClient = Stomp.over(socket);
    stompClient.heartbeat.outgoing = 10000;
    stompClient.heartbeat.incoming = 10000;
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/user/queue/session/' + fileId, (message) => processMessage(message));
    });
    socket.onclose = function (close) {
        stompClient.disconnect();
        socket.close();
        console.log(close);
    };
    socket.onerror = function (error) {
        stompClient.disconnect();
        socket.close();
        console.log(error);
    };
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

$(function () {
    window.history.replaceState({}, document.title, window.location.href.split('/').pop().split('?').shift());
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect();});
});