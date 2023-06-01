let curRev = 0;
let curUser;

const changesQueue = [];
const chatQueue = [];

const colours = new Map();
//TODO: убрать хардкод
colours.set('MollyZen', HSLtoString(generateHSL('MollyZen')));

const pending = new Map();

const history = [];

const AllowedTokens = {
    CHAR_KEPT : "=",
    CHAR_ADDED : "+",
    CHAR_REMOVED : "-",
    APPLY_FORMATTING : "*"
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

    this.sent = false;

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
    this.getLengthChange = () => {
        let sum = 0;
        this.tokens.forEach(val => sum += val.match(/[+-][0-9]+/) ? parseInt(val) : 0);
        return sum;
    }
    this.getChanges = () => {
        let sum = this.getLengthChange();
        let changes = this.start + (sum<0?"":"+") + sum + '#';
        changes += this.tokens.join('');
        changes += '#' + this.text;
        return changes;
    }
    this.toMessageJSON = () => {
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
    this.merge = (changes) => {
        const lengthChange = changes.getLengthChange();
        const thisLengthChange = changes.getLengthChange();
        let thisTokenCopy = this.tokens.slice();
        let thisTextRemaining = this.text;
        let thisTextDeletedRemaining = this.deletedText;
        let thisStart = this.start;
        let thisStyling = accumulateStyling(thisTokenCopy);
        let thisEnd = this.start;
        switch (thisTokenCopy[0].slice(0, 1)){
            case '+' :
            case '=' : thisEnd += parseInt(thisTokenCopy[0].slice(1));
        }

        let changesTokenCopy = changes.tokens.slice();
        let changesTextRemaining = changes.text;
        let changesTextDeletedRemaining = changes.deletedText;
        let changesStart = changes.start;
        let changesStyling = accumulateStyling(changesTokenCopy);
        let changesEnd = changes.start;
        switch (changesTokenCopy[0].slice(0,1)){
            case '-' :
            case '=' : changesEnd += parseInt(changesTokenCopy[0].slice(1));
        }

        this.text = '';
        this.tokens = [];
        this.deletedText = '';

        let thisToken = thisTokenCopy.pop();
        let changesToken = changesTokenCopy.pop();
        while (thisToken || changesToken){
            if (thisToken && (thisEnd <= changesStart || changesToken == null)){
                this.tokens.push(...thisStyling);
                this.tokens.push(thisToken);
                const [first, second] = splitString(thisTextRemaining, parseInt(thisToken));
                this.text += first;
                thisTextRemaining = second;
                thisStyling = accumulateStyling(thisTokenCopy);
                thisToken = thisTokenCopy.shift();
                thisStart = thisEnd;
                thisEnd = thisStart;
                if (thisToken) {
                    switch (thisToken.slice(0, 1)) {
                        case '+' :
                        case '=' :
                            thisEnd += parseInt(thisToken.slice(1));
                    }
                }
            }
            else if (changesToken && (changesEnd <= thisStart || thisToken == null)){
                this.tokens.push(...changesStyling);
                this.tokens.push(changesToken);
                const [first, second] = splitString(changesTextRemaining, parseInt(changesToken));
                this.text += first;
                changesTextRemaining = second;
                changesStyling = accumulateStyling(changesTokenCopy);
                changesToken = changesTokenCopy.shift();
                changesStart = changesEnd;
                changesEnd = changesStart;
                if (changesToken) {
                    switch (changesToken.slice(0, 1)) {
                        case '-' :
                        case '=' :
                            changesEnd += parseInt(changesToken.slice(1));
                    }
                }
            }
            else {
                if (thisStart !== changesStart){
                    if (thisStart < changesStart){
                        let val = changesStart - thisStart;
                        let token = thisToken.slice(0, 1);
                        let tokenVal = parseInt(thisToken.slice(1));
                        let subval = tokenVal - thisEnd + val;
                        thisTokenCopy.unshift(token + subval);
                        thisTokenCopy.unshift([...thisStyling]);
                        thisToken = token + (tokenVal - subval);
                    }
                    else {
                        let val = thisStart - changesStart;
                        let token = changesToken.slice(0, 1);
                        let tokenVal = parseInt(changesToken.slice(1));
                        let subval = tokenVal - changesEnd + val;
                        changesTokenCopy.unshift(token + subval);
                        changesTokenCopy.unshift([...changesStyling]);
                        changesToken = token + (tokenVal - subval);
                    }
                }
                else if (thisEnd !== changesEnd){
                    if (thisEnd < changesEnd){
                        let val = changesEnd - thisEnd;
                        let token = thisToken.slice(0, 1);
                        let tokenVal = parseInt(thisToken.slice(1));
                        let subval = tokenVal - thisEnd + val;
                        thisTokenCopy.unshift(token + subval);
                        thisTokenCopy.unshift([...thisStyling]);
                        thisToken = token + (tokenVal - subval);
                    }
                    else {
                        let val = thisEnd - changesEnd;
                        let token = changesToken.slice(0, 1);
                        let tokenVal = parseInt(changesToken.slice(1));
                        let subval = tokenVal - changesEnd + val;
                        changesTokenCopy.unshift(token + subval);
                        changesTokenCopy.unshift([...changesStyling]);
                        changesToken = token + (tokenVal - subval);
                    }
                }
                else {
                    let thisTokenToken = thisToken.slice(0,1);
                    let changesTokenToken = changesToken.slice(0,1);
                    if (thisTokenToken === '='){
                        if (changesTokenToken === '-'){
                            thisStyling = accumulateStyling(thisTokenCopy);
                            thisToken = thisTokenCopy.shift();
                            this.tokens.push(changesToken);
                            changesStyling = accumulateStyling(changesTokenCopy);
                            changesToken = changesTokenCopy.shift();
                        }
                        else {
                            let stylingMap = new Map();
                            thisStyling.forEach(val => {
                                const split = val.split(':');
                                stylingMap.set(split[0], split[1]);
                            });
                            changesStyling.forEach(val => {
                                const split = val.split(':');
                                stylingMap.set(split[0], split[1]);
                            })
                            stylingMap = new Map([...stylingMap.entries()].sort());
                            stylingMap.forEach(val => this.tokens.push(val[0] + ':' + val[1]))
                        }
                    }
                    else if (thisTokenToken === '+'){
                        if (changesTokenToken === '-'){
                            thisTextRemaining = thisTextRemaining.slice(thisToken.slice(1));
                            changesTextDeletedRemaining = changesTextDeletedRemaining.slice(changesToken.slice(1));
                            thisStyling = accumulateStyling(thisTokenCopy);
                            thisToken = thisTokenCopy.shift();
                            changesStyling = accumulateStyling(changesTokenCopy);
                            changesToken = changesTokenCopy.shift();
                        }
                        else {
                            let stylingMap = new Map();
                            thisStyling.forEach(val => {
                                const split = val.split(':');
                                stylingMap.set(split[0], split[1]);
                            });
                            changesStyling.forEach(val => {
                                const split = val.split(':');
                                stylingMap.set(split[0], split[1]);
                            })
                            stylingMap = new Map([...stylingMap.entries()].sort());
                            stylingMap.forEach(val => this.tokens.push(val[0] + ':' + val[1]))
                        }
                    }
                }
            }
        }
    }
}

function accumulateStyling(tokens){
    let res = [];
    let val = tokens.shift();
    while (val && val.charAt(0) === '*') {
        res.push(val);
        val = tokens.shift();
    }
    if (val) tokens.unshift(val);

    return res;
}

function ChatMessage(user, message, timestamp){

}

function CursorUpdate(user, pos){

}

function StatusUpdate(user, status){

}

//received message processing

const t= setInterval(() => {if (changesQueue.length > 0) submitChanges(changesQueue[0].changes)},1000);

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
    if (curRev - obj.message.revision > 1 && obj.message.user !== "SYSTEM") {
        pending.set(obj.message.revision, {messageId, obj});
        return;
    }
    const firstInQueue = changesQueue[0];
    if (firstInQueue && messageId === firstInQueue.messageId){
        if (firstInQueue.changes.getChanges() === obj.message.changes) {
            history.push(changesQueue.shift());
            curRev = obj.message.revision;
        }
        else{
            console.log('UNDO IS SUPPOSED TO HAPPEN');
        }
        if (changesQueue[0]) {
            submitChanges(changesQueue[0].changes);
        }
    }
    else {
        let split = obj.message.changes.split(/#/);
        let start = parseInt(split[0].split(/[+-]/)[0]);
        let lengthChange = parseInt(split[0].slice(start.toString().length));
        let movedPos = 0;
        let remainingText = split[2];

        let formatting = [];
        split[1].match(/([+\-=]|\*[0-9]+:)[0-9]+/g).forEach(val => {
            let numValue = parseInt(val.slice(1));
            if (val.match(/\*[0-9]+/))
                formatting.push(val.slice(1));
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
                handleTextInput(first, formatting.join(' '), start + movedPos);
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
    const nextObj = pending.get(obj.message.revision + 1);
    if (nextObj){
        pending.delete(nextObj.obj.message.revision);
        processChanges(null, nextObj);
    }
}

//message submission
function submitChanges(changes){
    if (changesQueue.length === 0 || changesQueue[0].changes === changes) {
        let messageId;
        if (changesQueue.length === 0) {
            messageId = makeid(5);
            changesQueue.push({messageId, changes});
        }
        else
            messageId = changesQueue[0].messageId;

        if (stompClient && !changes.sent) {
            stompClient.send('/app/session/' + fileId,
                {'message-id': messageId},
                changes.toMessageJSON());
            changes.sent = true;
        }
    }
    else {
        const lastInQueue = changesQueue[changesQueue.length - 1];
        if (!lastInQueue.changes.sent && lastInQueue.changes.revision === changes.revision)
            lastInQueue.changes.merge(changes);
        else {
            const messageId = makeid(5);
            changesQueue.push({messageId, changes});
        }
    }
}

function submitChatMessage(message){

}

function submitCursorUpdate(update){

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