let curRev = 0;
let curUser;

const changesQueue = [];
const chatQueue = [];

const colours = new Map();
//TODO: убрать хардкод
colours.set('MollyZen', HSLtoString(generateHSL('MollyZen')));


const AllowedTokens = {
    CHAR_KEPT : "=",
    CHAR_ADDED : "+",
    CHAR_REMOVED : "-",
    APPLY_FORMATTING : "*"
}
function Token(token, value) {
    this.token = token;
    this.value = value;
}

// message objects
function Changes(user, revision, start) {
    this.user = user;
    this.revision = revision;
    this.start = start;

    this.tokens = [];
    this.text = '';

    this.deletedText = '';

    this.styleCodes = new Map();

    this.skipText = (length, style) => {
        styleStringToArr(style).forEach(val => this.tokens.push('*' + val.code + ':' + val.value));
        this.tokens.push('=' + length);
        return this;
    }
    this.addText = (text, style) => {
        styleStringToArr(style).forEach(val => this.tokens.push('*' + val.code + ':' + val.value));
        this.tokens.push('+' + text.length);
        this.text += text;
        return this;
    }
    this.removeText = (length, deletedText) => {
        this.tokens.push('-' + length);
        if (deletedText) this.deletedText += deletedText;
        return this;
    }
    this.getChanges = () => {
        let sum = 0;
        this.tokens.forEach(val => sum += val.match(/[+-][0-9]+/) ? parseInt(val) : 0);
        let changes = this.start + (sum<0?"":"+") + sum + '#';
        changes += this.tokens.join('');
        changes += '#' + this.text;
        return changes;
    }
    this.toJSON = () => {
        const obj = {
            "type" : "CHANGES",
            "message" : {
                "user": curUser,
                "changes": this.getChanges(),
                "revision": curRev
            }
        }
        return JSON.stringify(obj);
    }
    this.equals = (changes) => {
        return this.getChanges() === changes.getChanges()
    }
}

function ChatMessage(user, message, timestamp){

}

function CursorUpdate(user, pos){

}

function StatusUpdate(user, status){

}

//received message processing

function processMessage(message) {
    const obj = JSON.parse(message.body);
    const type = obj.type;
    switch (type){
        case 'CHANGES' : processChanges(message.headers["message-id"], obj); break;
        case 'CHAT' : break;
        case 'CURSOR' : break;
        case 'STATUS' : break;
    }
}

function processChanges(messageId, obj) {
    const firstInQueue = changesQueue[0];
    if (firstInQueue && messageId === firstInQueue.messageId){
        if (firstInQueue.changes.getChanges() === obj.message.changes) {
            changesQueue.shift();
            curRev = obj.message.revision;
        }
        //TODO: implement undo
    }
    else {
        let split = obj.message.changes.split(/#/);
        let start = parseInt(split[0].split(/[+-]/)[0]);
        let lengthChange = parseInt(split[0].slice(start.toString().length));
        let movedPos = 0;
        let remainingText = split[2];

        let formatting = [];
        split[1].match(/[+\-*=][0-9]+/g).forEach(val => {
            let numValue = parseInt(val.slice(1));
            if (val.match(/\*[0-9]+/))
                formatting.push(val); //TODO: сделать что-то с обработкой списка
            else if (val.match(/=[0-9]+/)) {
                if (formatting.length > 0) {
                    changeFormatting();
                    formatting = [];
                }
                movedPos += numValue;
            }
            else if (val.match(/-[0-9]+/)) {
                deleteText(start + movedPos, numValue);
            }
            else if (val.match(/\+[0-9]+/)) {
                let [first, second] = splitString(remainingText, numValue)
                handleTextInput(first, formatting, start + movedPos);
                remainingText = second;
                movedPos += numValue;
                formatting = [];
            }
        })
        curRev = obj.message.revision;

        lastPositionChangeStart = start;
        lastPositionChangeLength = lengthChange;
        pane.dispatchEvent(new Event('input'/*, {bubbles:true}*/));
    }
}

//message submission
function submitChanges(changes){
    const messageId = makeid(5);
    changesQueue.push({messageId, changes});
    if (stompClient)
        stompClient.send('/app/session/' + fileId,
        {'message-id': messageId},
        changes.toJSON());
}

function submitChatMessage(message){

}

function submitCursorUpdate(update){

}
function parseMessage(message) {
    const split = message.body.split(/#/);

    var subsplit = split[0].split(/[+-]/)
    const start = subsplit[0];
    const changeLength = subsplit[1];

    subsplit = split[1].split(' ');
    var tokens = [];
    subsplit.forEach(el => tokens.push(new Token(el.charAt(0), el.substring(1))));

    var newText = split[2];

    var changes = new Changes(null, null, start, changeLength, tokens, newText);
}

///misc
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
function addUser(name, colour){
    let newUser = document.createElement('span');
    newUser.setAttribute('class', 'tooltip');
    newUser.setAttribute('id', 'tooltip');
    newUser.setAttribute('aria-hidden', 'true');
    newUser.setAttribute('contenteditable', false);
    newUser.appendChild(document.createTextNode(name));
    document.querySelector('#tmp').appendChild(newUser);
}