let curRev = 0;
let curUser;

const changesQueue = [];
const chatQueue = [];

const users = new Map();
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

function ChatMessage(text, user, timestamp, id) {
    this.text = text;
    this.user = user;
    this.timestamp = timestamp;
    this.id = id;

    this.toMessageJSON = () => {
        const obj = {
            "type" : "CHAT",
            "message" : {
                "user": curUser,
                "message": this.text,
                "timestamp": null,
                "messageId":null
            }
        }
        return JSON.stringify(obj);
    }
}

function User(user, username, status){
    this.user = user;
    this.username = username;
    this.status = status;
    this.colour = generateHSL(user);
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

//received message processing

const t= setInterval(() => {if (changesQueue.length > 0) submitChanges(changesQueue[0].changes)},1000);

function processMessage(message) {
    const obj = JSON.parse(message.body);
    const type = obj.type;
    const messageId = message.headers["message-id"];
    switch (type){
        case 'CHANGES' : processChanges(messageId, obj); break;
        case 'CHAT' :
            var d = new Date(0);
            d.setUTCSeconds(obj.message.timestamp);

            const formattedDate = (d.getDate() < 10 ? '0' : '') + d.getDate() + '.' + (d.getMonth() < 10 ? '0' : '') + (d.getMonth() + 1) + '.' + d.getFullYear();
            const formattedTime = d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

            const rec = document.getElementById('chatreceived');
            let el;
            const id = obj.message.messageId;
            if (document.getElementById(messageId) && obj.message.user === curUser)
                document.getElementById(messageId).remove();

            const header = document.createElement('div');
            header.style.backgroundColor = HSLtoString(users.get(obj.message.user).colour);
            const name = document.createElement('span');
            name.appendChild(document.createTextNode(users.get(obj.message.user).username + ':'));
            const icon = document.createElement('span');
            icon.style.float = 'right';
            icon.appendChild(document.createTextNode(formattedTime + ', ' + formattedDate));
            header.appendChild(name);
            header.appendChild(icon);
            header.style.padding = '5px';

            const body = document.createElement('div');
            body.appendChild(document.createTextNode(obj.message.message));
            body.style.padding = '5px';

            const newPending = document.createElement('div');
            newPending.appendChild(header);
            newPending.appendChild(body);
            newPending.setAttribute('id', 'message' + id);

            el = newPending;


            let iterId = id;
            let done = false;
            while (!done) {
                if (iterId === 0) {
                    if (rec.childNodes.length === 0)
                        rec.appendChild(el);
                    else
                        rec.childNodes[0].before(el);
                    done = true;
                }
                else if (document.querySelector('#chatreceived #message' + (iterId - 1))){
                    document.querySelector('#chatreceived #' + (iterId - 1)).after(el);
                    done = true;
                }
                else {
                    --iterId;
                }
            }

            break;
        case 'CURSOR' : break;
        case 'STATUS' :
            const user = obj.message.user;
            if (obj.message.status === 'CONNECTED' || obj.message.status === 'YOU'){
                const username = obj.message.value;
                let newUser = new User(user, username, 'ONLINE');
                users.set(user, newUser);
                if (obj.message.status === 'YOU') {
                    curUser = user;
                    document.getElementById('currentImage').style.background = HSLtoString(newUser.colour);
                    document.getElementById('currentImage').textContent = newUser.username.split(' ').map(e => e.charAt(0)).join('');
                }
            }
            else {
                users.delete(user);
            }
            break;
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
            setRev(obj.message.revision);
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
        setRev(obj.message.revision);

        lastPositionChangeStart = start;
        lastPositionChangeLength = lengthChange;
        pane.dispatchEvent(new Event('input'));
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
    const id = makeid(5);

    const header = document.createElement('div');
    const name = document.createElement('span');
    name.appendChild(document.createTextNode(users.get(curUser).username + ':'));
    const icon = document.createElement('i');
    icon.style.float = 'right';
    icon.classList.add('bi', 'bi-clock');
    header.appendChild(name);
    header.appendChild(icon);

    const body = document.createElement('div');
    body.appendChild(document.createTextNode(message.text));

    const newPending = document.createElement('div');
    newPending.setAttribute('id', id);
    newPending.appendChild(header);
    newPending.appendChild(body);

    const pendingEl = document.getElementById('chatpending');
    pendingEl.appendChild(newPending);

    stompClient.send('/app/session/' + fileId,
        {'message-id': id},
        message.toMessageJSON());
}

function submitCursorUpdate(update){

}

///misc
function setRev(rev){
    curRev = rev;
    //document.getElementById("rev_count").textContent = rev;
}
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