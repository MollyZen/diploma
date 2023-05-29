var pane;
var firstPage;

let userCaret = null;
let lastPositionChangeStart = null;
let lastPositionChangeLength = null;

let pages = new Map();

let thereWasDelete = false;

function setPane(newPane) {
    pane = newPane;
    //mouse
    pane.addEventListener('click', (e) => {
        const [start, end] = getViewCaretStartEnd();
        userCaret = start;
        console.log('caret position: ' + start);
        //toggleTooltip(e, pane);
    })
    pane.addEventListener('keyup', function (ev) {
        if (ev.key.match(/Arrow.*/)) {
            const caret = getViewCaretIndex();
            userCaret = caret;
            console.log('caret position: ' + caret);
        }
    })
    pane.addEventListener('keydown', function (ev){
        if (ev.key === 'Backspace'){
            ev.preventDefault();
            const [start, end] = getViewCaretStartEnd();
            userCaret = start;
            let changes;
            if (start === end) {
                changes = new Changes(curUser, curRev, start - 1);
                const deletedText = deleteText(start - 1, 1);
                changes.removeText(1, deletedText)
                lastPositionChangeStart = start - 1;
                lastPositionChangeLength = -1;
            }
            else {
                changes = new Changes(curUser, curRev, start);
                const deletedText = deleteText(start, end - start);
                changes.removeText(end - start, deletedText)
                lastPositionChangeStart = start;
                lastPositionChangeLength = (end - start) * -1;
            }

            submitChanges(changes);
            pane.dispatchEvent(new Event('input'/*, {bubbles:true}*/));
        }
        else if (ev.key === 'Enter'){
            ev.preventDefault();
            const [start, end] = getViewCaretStartEnd();
            userCaret = start;
            const changes = new Changes(curUser, curRev, start);

            let deletedText = '';
            if (end > start) {
                deletedText = deleteText(start, end - start);
                changes.removeText(end - start, deletedText)
            }

            if (!ev.shiftKey) {
                handleTextInput('\n', null, start);
                changes.addText('\n', null);
            }
            else {
                handleTextInput('\v', null, start);
                changes.addText('\v', null);
            }

            lastPositionChangeStart = start;
            lastPositionChangeLength = 1;

            submitChanges(changes);
            pane.dispatchEvent(new Event('input'/*, {bubbles:true}*/));
        }
        else if (ev.key === 'Tab'){
            ev.preventDefault();
            const [start, end] = getViewCaretStartEnd();
            userCaret = start;
            const changes = new Changes(curUser, curRev, start);

            let deletedText = '';
            if (end > start) {
                deletedText = deleteText(start, end - start);
                changes.removeText(end - start, deletedText)
            }
            handleTextInput('\t', null, start);
            changes.addText('\t', null);

            lastPositionChangeStart = start;
            lastPositionChangeLength = 1;

            submitChanges(changes);
            pane.dispatchEvent(new Event('input'/*, {bubbles:true}*/));
        }
    })
    pane.addEventListener('beforeinput', function (ev){
        ev.preventDefault();

        const [start, end] = getViewCaretStartEnd();
        userCaret = start;

        const changes = new Changes(curUser, curRev, start);
        let deletedText = '';
        if (end > start) {
            deletedText = deleteText(start, end - start);
            changes.removeText(end - start, deletedText)
        }
        handleTextInput(ev.data, getEnabledStylesString(), start);
        changes.addText(ev.data, getEnabledStylesString());
        lastPositionChangeStart = start;
        lastPositionChangeLength = ev.data.length;

        submitChanges(changes);
        pane.dispatchEvent(new Event('input'/*, {bubbles:true}*/));
    });
    pane.addEventListener('paste', (ev) => {
        ev.preventDefault();

        const [start, end] = getViewCaretStartEnd();
        userCaret = start;

        const changes = new Changes(curUser, curRev, start);
        let deletedText = '';
        if (end > start) {
            deletedText = deleteText(start, end - start);
            changes.removeText(end - start, deletedText)
        }
        handleTextInput(ev.clipboardData.getData('text/plain'), null, start);
        changes.addText(ev.clipboardData.getData('text/plain'), null);
        lastPositionChangeStart = start;
        lastPositionChangeLength = ev.clipboardData.getData('text/plain').length;

        submitChanges(changes);
        pane.dispatchEvent(new Event('input'/*, {bubbles:true}*/));
    })
    pane.addEventListener('input', (ev) => {
        ev.preventDefault();
        if (lastPositionChangeStart != null){
            if (lastPositionChangeLength > 0){
                if (lastPositionChangeStart <= userCaret){
                    setCaret(userCaret + lastPositionChangeLength);
                    userCaret += lastPositionChangeLength;
                    lastPositionChangeStart = null;
                    lastPositionChangeLength = null;
                }
                else {
                    setCaret(userCaret)
                }
            }
            else {
                if (lastPositionChangeStart < userCaret){
                    setCaret(userCaret + lastPositionChangeLength);
                    userCaret += lastPositionChangeLength;
                    lastPositionChangeStart = null;
                    lastPositionChangeLength = null;
                }
                else {
                    setCaret(userCaret)
                }
            }
        }
    })
}

const pageWidth = '210mm';
const pageHeight = '297mm';

const topMargin = '25.4mm';
const bottomMargin = '25.4mm';
const leftMargin = '25.4mm';
const rightMargin = '25.4mm';

function initPages(){
    pane.setAttribute('style', pane.getAttribute('style') + '; width: ' + pageWidth);
    pane.setAttribute('style', pane.getAttribute('style') + '; height: ' + pageHeight);
    pane.setAttribute('style', pane.getAttribute('style') + '; background-color: white');
    pane.setAttribute('style', pane.getAttribute('style') + '; padding: ' + topMargin);
}

function setCaret(pos) {
    let [node, checked] = getAffectedNode(ropeRoot, pos);
    if (node.text.match(/(\n|\v)/)) {
        const prevNode = node;
        node = node.nextTextNode();
        if (node == null)
            node = prevNode;
    }

    const view = modelViewRelMap.get(node);
    const viewEls = modelViewRelMap.get(view);
    const viewOffset = viewEls[0].getOffset();

    let range = document.createRange();

    try {
        range.setStart(view.childNodes[0], pos - viewOffset);
    } catch (error) {
        //range.setStart(view, pos - viewOffset - 1);
        const ch = view.parentElement.childNodes[0];
        const chEls = modelViewRelMap.get(ch);
        const newOffset =  chEls[0].getOffset();

        range.setStart(view.parentElement, pos - newOffset - 1);
    }
    range.collapse(true);

    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

///
///NEW STUFF
///

function appendToTextNode(el, pos, text){
    const srcText = el.textContent;
    const newText = (srcText.slice(0, pos) || '') + text + (srcText.slice(pos) || '');
    el.childNodes.forEach(val => {
        if (val.nodeName === '#text')
            val.remove();
    })
    if (el.childNodes[0])
        el.childNodes[0].before(document.createTextNode(newText));
    else
        el.appendChild(document.createTextNode(newText));
    return el;
}

function removeFromTextNode(el, pos, size){
    const srcText = el.textContent;
    const newText = (srcText.slice(0, pos) || '') + (srcText.slice(pos + size) || '');
    el.childNodes.forEach(val => {
        if (val.nodeName === '#text')
            val.remove();
    })
    if (el.childNodes[0])
        el.childNodes[0].before(document.createTextNode(newText));
    else
        el.appendChild(document.createTextNode(newText));
    return el;
}

function createNewTextNode(el, text, style, isBefore, isChild){
    const tmp = document.createElement('span');

    if (text) tmp.appendChild(document.createTextNode(text));

    if (style) styleStringToArr(style).forEach(val => applyFormattingToElement(tmp, val.code, val.value));

    if (isChild){
        el.appendChild(tmp);
    }
    else {
        if (isBefore)
            el.before(tmp);
        else
            el.after(tmp);
    }
    return tmp;
}

function addParagraph(el, text, style, isBefore){
    const tmp = document.createElement('div');
    const span = document.createElement('span');
    if (text) span.appendChild(document.createTextNode(text));
    const br = document.createElement('br');
    br.setAttribute('class', 'newline');
    span.appendChild(br);
    tmp.appendChild(span);
    //TODO: styling
    if (isBefore)
        el.before(tmp);
    else
        el.after(tmp);
    return tmp;
}

///
//showing username next to cursor
///
function toggleTooltip(event, contenteditable) {
    const tooltip = document.getElementById("tooltip");
    if (contenteditable.contains(event.target)) {
        const { x, y } = getCaretCoordinates(contenteditable);
        tooltip.setAttribute("aria-hidden", "false");
        tooltip.setAttribute(
            "style",
            `display: inline-block; left: ${x}px; top: ${y - 20}px`
        );
        tooltip.setAttribute('style', tooltip.getAttribute('style') + ';background-color: ' + colours.get('MollyZen'))
    } else {
        tooltip.setAttribute("aria-hidden", "true");
        tooltip.setAttribute("style", "display: none;");
    }
}

///
//colours for users/cursors
///
function getHashOfString (str){
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    return hash;
}
function normalizeHash(hash, min, max){
    return Math.floor((hash % (max - min)) + min);
}

function generateHSL(name) {
    const hRange = [0, 360];
    const sRange = [50, 75];
    const lRange = [25, 60];

    const hash = getHashOfString(name);
    const h = normalizeHash(hash, hRange[0], hRange[1]);
    const s = normalizeHash(hash, sRange[0], sRange[1]);
    const l = normalizeHash(hash, lRange[0], lRange[1]);
    return [h, s, l];
}

function HSLtoString(hsl){
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
}

function testColourToConsole(str){
    let hsl = HSLtoString(generateHSL(str));
    console.log('%c ' + str, 'background-color: ' + hsl);
}