var pane;
var firstPage;

let userCaret = null;
let lastPositionChangeStart = null;
let lastPositionChangeLength = null;

let pages = new Map();

let thereWasDelete = false;

window.mobileAndTabletCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

function setPane(newPane) {
    pane = newPane;
    pane.firstChild.remove();
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
                deletedText.forEach(val => changes.removeText(1, val[0], val[1]));
                lastPositionChangeStart = start - 1;
                lastPositionChangeLength = -1;
            }
            else {
                changes = new Changes(curUser, curRev, start);
                const deletedText = deleteText(start, end - start);
                deletedText.forEach(val => changes.removeText(1, val[0], val[1]));
                lastPositionChangeStart = start;
                lastPositionChangeLength = (end - start) * -1;
            }

            submitChanges(changes);
            pane.dispatchEvent(new Event('input'));
        }
        else if (ev.key === 'Enter'){
            ev.preventDefault();
            const [start, end] = getViewCaretStartEnd();
            userCaret = start;
            const changes = new Changes(curUser, curRev, start);

            let deletedText = '';
            if (end > start) {
                deletedText = deleteText(start, end - start);
                deletedText.forEach(val => changes.removeText(1, val[0], val[1]));
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
                deletedText.forEach(val => changes.removeText(1, val[0], val[1]));
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
            deletedText.forEach(val => changes.removeText(1, val[0], val[1]));
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
            deletedText.forEach(val => changes.removeText(1, val[0], val[1]));
        }
        handleTextInput(ev.clipboardData.getData('text/plain'), null, start);
        changes.addText(ev.clipboardData.getData('text/plain'), null);
        lastPositionChangeStart = start;
        lastPositionChangeLength = ev.clipboardData.getData('text/plain').length;

        submitChanges(changes);
        pane.dispatchEvent(new Event('input'));
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
    if (mobileAndTabletCheck()) {
        pane.setAttribute('contenteditable', 'false');
    }
}

const pageWidth = '210mm';
const pageHeight = '297mm';

const topMargin = '25.4mm';
const bottomMargin = '25.4mm';
const leftMargin = '25.4mm';
const rightMargin = '25.4mm';

function initPages(){
    pane.setAttribute('style', pane.getAttribute('style') + '; width: calc(' + pageWidth + ' - ' + topMargin + ')');
    pane.setAttribute('style', pane.getAttribute('style') + '; height: calc(' + pageHeight + ' - ' + topMargin + ')');
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

function addParagraph(el, text, style, isBefore, insert){
    const tmp = document.createElement('div');
    const span = document.createElement('span');
    if (text) span.appendChild(document.createTextNode(text));
    const br = document.createElement('br');
    br.setAttribute('class', 'newline');
    span.appendChild(br);
    tmp.appendChild(span);
    //TODO: styling
    if (insert){
        pane.appendChild(tmp);
    }
    else if (isBefore)
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
    const sRange = [50, 60];
    const lRange = [75, 80];

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