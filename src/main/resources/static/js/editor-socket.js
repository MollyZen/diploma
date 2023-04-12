var stompClient = null;
var socket = null;

const queryString = window.location.href;
var split = queryString.split('/');
split.pop();
const fileId = split.pop();
function connect() {
    var new_conn = function() {
        socket = new SockJS('/gs-guide-websocket');
    };
    new_conn();
    stompClient = Stomp.over(socket);
    stompClient.heartbeat.outgoing = 10000;
    stompClient.heartbeat.incoming = 10000;
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/user/queue/session/' + fileId, (message) => parseMessage(message));
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
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect();});
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#send" ).click(function() { stompClient.send('/app/session/' + fileId,{'message-id': makeid(5)},null); });
});

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}